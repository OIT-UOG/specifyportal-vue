import Vue from 'vue'
import Vuex from 'vuex'
import { normalize } from 'path';
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuex)

const BASE_SOLR_PATH = '../../../specify-solr'
//const BASE_SOLR_PATH = 'https://specifyportal.uog.edu/specify-solr'
const cache = {
  query_list: {}, // { cachable_query_url: [ spids of results }
  result_list: {} // { collection: { spid: { fields } } }
}

class Image {
  constructor(collection, spid, id, location, title) {
    this.id = id
    this.location = location
    this.title = title
    this.filename = location
    this.old_name = title
    this.collection = collection
    this.spid = spid
    this.unique_id = `${collection}_${id}`
    this.sizeRatio = null
    this.width = null
  }
}

const ROWS_PER_QUERY = 50
// what should the default rows be?
// could make it high and lazy-load the images.


class Query {
  constructor({ collections, queryTerms = ["*"], sort = false, asc = true, page = 0 }) {
    this.collections = [...collections];
    this.collections.sort();
    this.qs = [...queryTerms];
    this.sort = sort;
    this.asc = asc;
    this.page = page;
    this.results = [];
    this.lastPageNumber = null;
    this.total = null;
    this.facet_counts = {};
    this.msg = null;
  }

  get url() {
    const params = {};
    const colls = this.collections.join(",");
    if (colls) {
      params.colls = colls;
    }
    if (this.sort) {
      params.sort = this.sort;
      params.asc = this.asc;
    }
    params.page = this.page;
    params.q = JSON.stringify(this.qs);
    const paraml = [];
    for (const [key, value] of Object.entries(params)) {
      paraml.push(`${key}=${encodeURIComponent(value)}`);
    }
    return API_URL + `/search?${paraml.join("&")}`;
  }

  get hasMorePages() {
    return this.lastPageNumber === null || this.page <= this.lastPageNumber;
  }

  async quickFetch(signal) {[0]
    if (this.lastPageNumber !== null && this.page > this.lastPageNumber) {
      return false;
    }
    const call = await fetch(this.url, { signal });
    const res = await call.json();
    if ("detail" in res) {
      if (typeof res.detail === "string") {
        if (res.detail.startsWith("last page is -1, requested page was")) {
          this.results = [];
          this.total = 0;
          this.lastPageNumber = -1;
          this.facet_counts = [];
          this.msg = "No data available";
          return [];
        }
      } else if ("error" in res.detail && res.detail.error.code === 400) {
        this.results = [];
        this.total = 0;
        this.lastPageNumber = -1;
        this.facet_counts = [];
        this.msg = "Error in query";
        return [];
      }
    }

    res.docs = res.docs.map((sp) => {
      if (sp.img) {
        sp.img = sp.img.map((img) => {
          return new Image(img.coll, sp.spid, img.id, img.name, img.title);
        });
      }
      return sp;
    });
    this.lastPageNumber = res.last_page;
    this.total = res.total;
    res.docs.forEach((item) => {
      this.results.push(item);
    });
    this.facet_counts = this.processFacets(res.facet_counts);
    this.page += 1;
    return [...res.docs];
  }

  processFacets(facets) {
    return Object.keys(facets).reduce((acc, latlng) => {
      let [lat, lng] = latlng.split(' ').map(parseFloat)
      acc.push({
        position: {
          lat: lat,
          lng: lng,
        },
        amount: facets[latlng],
      });
      return acc;
    }, []);
  }
}

function resultObject(results) {
  return results.reduce((acc, res) => {
    if (res) {
      acc[res.collection] = res
    }
    return acc
  }, {})
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}


let API_URL;

// [color, dark]
const POLY_COLORS = [
  [colors.blue.base, true],
  [colors.yellow.darken1, false],
  [colors.purple.lighten3, false],
  [colors.red.lighten1, true],
  [colors.cyan.lighten1, true],
  [colors.grey.base, true],
  [colors.orange.darken2, true],
  [colors.green.darken2, true],
]

const GUAM = { lat: 13.477342, lng: 144.791369 };

export default new Vuex.Store({
  state: {
    // general states
    drawer: true,
    cardOpen: false,

    // api states
    loaded: false,
    query: null,
    queryTerms: {},
    manualQueryTerms: [],
    queryLoading: false,
    queryRan: false,
    queryMessage: null,
    sort: {
      field: null,
      asc: false,
    },
    searchTerms: ["*"],
    customSettings: {},
    apiSyntax: {},
    fields: {},
    fieldList: [],
    entries: [],
    query: null,
    geoFacets: [],
    geoFacetsFiltered: [],
    globalGeoFacets: [],
    filterPolys: {},
    filterPolyIdCounter: 0,
    total: null, // fill this
    lastPage: null, // fill this
    // abort stuff. not sure if this saves api flops
    abortController: null,
    fieldTranslations: {
      startDate: "Collection Date",
      collection: "Collection",
      collectors: "Collectors",
      determinations: "Determinations",
      catalogNumber: "Catalog Number",
      preparations: "Preparations",
      latitude1: "Latitude",
      longitude1: "Longitude",
    },

    // additional map stuff
    google: null,
    googleSet: false,
    mapZoom: 11,
    mapCenter: GUAM,
    mapBounds: null,
    filterPolyHighlighted: null,
  },
  mutations: {
    setDrawer(state, open) {
      state.drawer = open;
    },
    setCardOpen(state, open) {
      state.cardOpen = open;
    },
    setLoadingState(state, loaded) {
      state.loaded = loaded;
    },
    setFields(state, fields) {
      state.fields = fields;
    },
    setFieldList(state, fields) {
      state.fieldList = fields;
    },
    setSettings(state, settings) {
      state.customSettings = settings;
    },
    setFieldResultVisibility(state, { solrname, visibleInResults }) {
      state.fields[solrname].visibleInResults = visibleInResults;
    },
    setQueryLoading(state, loaded) {
      state.queryLoading = loaded;
    },
    setQueryRan(state, ran) {
      state.queryRan = ran;
    },
    setSyntax(state, syntax) {
      state.apiSyntax = syntax;
    },
    setEntries(state, entries) {
      state.entries = entries;
    },
    addEntries(state, entries) {
      state.entries.push(...entries);
    },
    setQueryMessage(state, msg) {
      state.queryMessage = msg;
    },
    setTotal(state, total) {
      state.total = total;
    },
    setLastPage(state, lastPage) {
      state.lastPage = lastPage;
    },
    setGeoFacets(state, facets) {
      state.geoFacets = facets;
    },
    setGeoFacetsFilter(state, inOutFilterList) {
      state.geoFacetsFiltered = inOutFilterList
    },
    setGlobalGeoFacets(state, geoFacets) {
      state.globalGeoFacets = geoFacets;
    },
    setFilterPolyPath(state, { poly, path }) {
      Vue.set(state.filterPolys[poly.id], 'path', path);
    },
    setFilterPolySelected(state, { poly, selected }) {
      Vue.set(state.filterPolys[poly.id], 'selected', selected);
    },
    deleteFilterPoly(state, poly) {
      Vue.delete(state.filterPolys, poly.id)
    },
    addFilterPoly(state, poly) {
      Vue.set(state.filterPolys, poly.id, poly);
    },
    setFilterPolyHighlighted(state, poly) {
      state.filterPolyHighlighted = poly
    },
    incrementFilterPolyCounter(state) {
      state.filterPolyIdCounter += 1;
    },
    setGoogle(state, googleApi) {
      state.google = googleApi
      state.googleSet = true
    },
    setMapZoom(state, zoom) {
      state.mapZoom = zoom
    },
    setMapCenter(state, center) {
      state.mapCenter = center
    },
    setMapBounds(state, bounds) {
      state.mapBounds = bounds
    },
    _setImgSize(state, payload) {
      let img = payload.getters.getImage(payload.unique_id);
      img.sizeRatio = payload.size;
      img.width = payload.px;
    },
    setAbortController(state, controller) {
      state.abortController = controller;
    },
    rebuildQuery(state) {
      let params = {
        collections: state.queryTerms.coll.and ? [] : [...state.queryTerms.coll.list],
      };

      const fs = Object.entries(state.queryTerms)
        .filter(([field, { and, list }]) => {
          return field !== "coll" && list.length > 0;
        })
        .map(([field, { and, list }]) => {
          return [
            and ? state.apiSyntax.AND : state.apiSyntax.OR,
            ...list.map((item) => {
              return Array.isArray(item)
                ? [
                    field,
                    ...item.map((i) => {
                      return typeof i === "string" ? i.toLowerCase() : i;
                    }),
                  ]
                : [field, typeof item === "string" ? item.toLowerCase() : item];
            }),
          ];
        });
      const queryTerms = [state.apiSyntax.AND, ...state.searchTerms, ...fs, ...state.manualQueryTerms];
      params.queryTerms = queryTerms;

      if (state.sort.field !== null) {
        params.sort = state.sort.field;
        params.asc = state.sort.asc;
      }

      state.query = new Query(params);
      state.queryMessage = null;
      state.queryRan = false;
    },
    setSearchTerms(state, terms) {
      state.searchTerms = terms && terms.length !== 0 ? terms : ["*"];
    },
    setSort(state, { field, asc }) {
      state.sort = {
        field: field,
        asc: asc,
      };
    },
    removeSort(state) {
      state.sort = {
        field: null,
        asc: false,
      };
    },
    // should query mutations reset the query also? or should this be from actions
    setQueryField(state, { field, and, list }) {
      // {<field: x>, [list: []], [and: false]}
      Vue.set(state.queryTerms, field, {
        and: and,
        list: list,
      });
    },
    // maybe don't use this, instead only use setQueryField
    toggleQueryFieldOp(state, field) {
      state.queryTerms[field].and = !state.queryTerms[field].and;
    },
    setManualQueryField(state, manualQueryTerms) {
      state.manualQueryTerms = manualQueryTerms
    },
  },
  getters: {
    collections(state) {
      return state.loaded ? Object.keys(state.customSettings) : [];
    },
    allColumns(state, getters) {
      return state.fieldList
        .filter((field) => {
          return field.displaycolidx !== null;
        })
        .concat(
          state.fieldList.filter((field) => {
            return field.displaycolidx === null;
          })
        );
    },
    visibleColumns(state, getters) {
      return getters.allColumns.filter((field) => {
        return field.visibleInResults;
      });
    },
    advancedSearchColumns(state, getters) {
      return state.fieldList.filter((col) => col.advancedsearch);
    },
    collectionSettings: (state) => (coll) => {
      return state.customSettings[coll];
    },
    getQueryTerm: (state) => (field) => {
      return JSON.parse(JSON.stringify(state.queryTerms[field]));
    },
    getSpecimenById: (state, getters) => (collection, spid) => {
      return state.entries.find((e) => e.spid === spid);
    },
    globalGeoFacetsPosByLat(state) {
      return state.globalGeoFacets.reduce((prev, curr) => {
        prev[curr.position.lat] = curr.position.lng
        return prev;
      }, {})
    },
    visibleGlobalGeoFacets(state) {
      return state.globalGeoFacets.filter((f, i) => state.geoFacetsFiltered[i])
    },
    invisibleGlobalGeoFacets(state) {
      return state.globalGeoFacets.filter((f, i) => !state.geoFacetsFiltered[i])
    },
    visibleGlobalGeoFacetsPosByLat(state, getters) {
      return getters.visibleGlobalGeoFacets.reduce((prev, curr) => {
        if (curr.position.lat in prev) {
          prev[curr.position.lat][curr.position.lng] = true
        } else {
          prev[curr.position.lat] = {[curr.position.lng]: true}
        }
        return prev;
      }, {})
    },
    visibleGeoFacetsPosByLat(state, getters) {
      return getters.visibleGeoFacets.reduce((prev, curr) => {
        if (curr.position.lat in prev) {
          prev[curr.position.lat][curr.position.lng] = true;
        } else {
          prev[curr.position.lat] = {[curr.position.lng]: true}
        }
        return prev;
      }, {})
    },
    visibleGeoFacets(state, getters) {
      let map = getters.visibleGlobalGeoFacetsPosByLat
      return state.geoFacets.filter(f => map[f.position.lat] && map[f.position.lat][f.position.lng])
    },
    invisibleGeoFacets(state, getters) {
      let map = getters.visibleGlobalGeoFacetsPosByLat
      return state.geoFacets.filter(f => !map[f.position.lat] || !map[f.position.lat][f.position.lng])
    },
    globalGeoFacetsNotVisibleGeoFacets(state, getters) {
      let map = getters.visibleGeoFacetsPosByLat
      return state.globalGeoFacets.filter(f => {
        if (!map[f.position.lat]) {
          return true
        }
        return !map[f.position.lat][f.position.lng]
      })
    },
    filterPolyList(state) {
      return Object.values(state.filterPolys);
    },
    filterPolyIsHighlighted: (state) => (poly) => {
      return state.filterPolyHighlighted === poly;
    },
    geoFacetsFilterEqual: (state) => (other) => {
      if (state.geoFacetsFiltered.length !== other.length) {
        return false;
      }
      for (let i=0; i<other.length; i++) {
        if (state.geoFacetsFiltered[i] !== other[i]) {
          return false;
        }
      }
      return true;
    },
    images(state) {
      return state.entries.reduce((acc, entry) => {
        acc.push(...entry.img);
        return acc;
      }, []);
    },
    imageUrl: (state, getters) => (coll, filename, size = 200) => {
      let settings = getters.collectionSettings(coll);
      let baseUrl = settings.imageBaseUrl;
      let collName = encodeURIComponent(settings.collectionName);
      if (!size) {
        size = -1;
      }
      return `${baseUrl}/fileget?coll=${collName}&type=T&filename=${filename}&scale=${size}`;
    },
    getImage: (state, getters) => (unique_id) => {
      return getters.images.find((img) => {
        return img.unique_id === unique_id;
      });
    },
    getImageSize: (state, getters) => (unique_id) => {
      return getters.getImage(unique_id).sizeRatio;
    },
    getImageWidth: (state, getters) => (unique_id) => {
      return getters.getImage(unique_id).width;
    },
    // really, I should be checking toLowerCase for everything but
    // probably not worth it to check if string and toLowerCase each item
    _inFieldList: (state, getters) => ({ field, item, list = null }) => {
      let arr = list;
      if (list === null) {
        arr = getters.getQueryTerm(field).list;
      }
      if (Array.isArray(item)) {
        return JSON.stringify(arr).toLowerCase().indexOf(JSON.stringify(item).toLowerCase()) >= 0;
      }
      return arr.indexOf(item) >= 0;
    },
    _dedupeFieldList: (state) => (list) => {
      let dedupe = [];
      list.forEach((item) => {
        if (Array.isArray(item)) {
          const arrs = JSON.stringify(dedupe).toLowerCase();
          const its = JSON.stringify(item).toLowerCase();
          if (arrs.indexOf(its) === -1) {
            dedupe.push(item);
          }
        } else {
          if (!dedupe.includes(item)) {
            dedupe.push(item);
          }
        }
      });
      return dedupe;
    },
  },
  actions: {
    async loadSettings(context, apiUrl) {
      API_URL = apiUrl;
      let resp = await fetch(API_URL + "/model");
      let fields = await resp.json();
      fields.forEach((f) => {
        if (f.title in context.state.fieldTranslations) {
          f.title = context.state.fieldTranslations[f.title];
        }
      });

      let fieldMap = fields.reduce((acc, field) => {
        acc[field.solrname] = field;
        if (field.solrname === "de") {
          field.advancedsearch = false;
        }
        field.visibleInResults = field.advancedsearch;
        return acc;
      }, {});

      context.commit("setFieldList", fields);
      context.commit("setFields", fieldMap);

      Object.keys(context.state.fields).forEach((field) => {
        context.commit("setQueryField", {
          field: field,
          list: [],
          and: false,
        });
      });

      resp = await fetch(API_URL + "/settings");
      let settings = await resp.json();

      context.commit("setSettings", settings.collections);
      context.commit("setSyntax", settings.search_syntax);

      context.commit("rebuildQuery");
      await context.dispatch("runNewQuery");
      context.commit('setGlobalGeoFacets', JSON.parse(JSON.stringify(context.state.geoFacets)));
      context.commit('setGeoFacetsFilter', context.state.geoFacets.map(f => true))
      context.commit("setLoadingState", true);
    },
    setDrawer(context, open) {
      context.commit("setDrawer", open);
    },
    setCardOpen(context, open) {
      context.commit("setCardOpen", open);
    },
    setGoogle(context, googleApi) {
      context.commit("setGoogle", googleApi);
      context.dispatch('updateGeoFacetsFilter');
    },
    setMapZoom(context, zoom) {
      context.commit('setMapZoom', zoom);
    },
    setMapCenter(context, center) {
      context.commit('setMapCenter', center);
    },
    setMapBounds(context, bounds) {
      context.commit('setMapBounds', bounds)
    },
    setSearchTerms(context, searches) {
      context.commit("setSearchTerms", searches);
      context.commit("rebuildQuery");
      return context.dispatch("runNewQuery");
    },
    // debounce this for sliders
    // how to do async vs no async versions?
    setQueryField(context, { field, and, list, rebuild=true }) {
      let dedupe = context.getters._dedupeFieldList(list);
      context.commit("setQueryField", { field, and, list: dedupe });
      if (rebuild) {
        context.commit("rebuildQuery");
        return context.dispatch("runNewQuery");
      }
    },
    async setManualQueryField(context, manualQueryTerms) {
      context.commit("setManualQueryField", manualQueryTerms);
      context.commit("rebuildQuery");
      return await context.dispatch("runNewQuery");
    },
    setGeoFacetsFilter(context, inOutFilterList) {
      context.commit("setGeoFacetsFilter", inOutFilterList);
    },
    createFilterPoly(context, { tl, size=0.5, selected=true, centered=false }) {
      let span = context.state.mapBounds.toSpan();
      let minSize = Math.min(span.lat(), span.lng()) * size;
      let growth = [[0,0], [0,1], [-1,1], [-1,0]];
      if (centered) {
        growth = [[0.5,-0.5], [0.5,0.5], [-0.5,0.5], [-0.5,-0.5]];
      }
      let path = growth.map(([dx, dy]) => {
        return {
          lat: tl.lat + dx * minSize,
          lng: tl.lng + dy * minSize
        }
      });

      let [ color, dark ] = POLY_COLORS[context.state.filterPolyIdCounter % POLY_COLORS.length];
      context.commit('addFilterPoly', {
        path,
        id: context.state.filterPolyIdCounter,
        color,
        dark,
        selected
      })
      context.commit('incrementFilterPolyCounter');
      context.dispatch('updateGeoFacetsFilter');
    },
    deleteFilterPoly(context, poly) {
      context.commit('deleteFilterPoly', poly);
      context.dispatch('updateGeoFacetsFilter');
    },
    setFilterPolyPath(context, { poly, path }) {
      context.commit('setFilterPolyPath', { poly, path });
      context.dispatch('updateGeoFacetsFilter');
    },
    setFilterPolySelected(context, { poly, selected }) {
      context.commit('setFilterPolySelected', { poly, selected });
      context.dispatch('updateGeoFacetsFilter');
    },
    setFilterPolyHighlighted(context, poly) {
      context.commit('setFilterPolyHighlighted', poly);
    },
    updateGeoFacetsFilter: _.debounce(async function(context) {
      // returns whether or not another query was done
      if (context.state.google === null || context.getters.filterPolyList.filter(p => p.selected).length === 0) {
        // assume only come in pairs
        if (context.state.manualQueryTerms.length !== 0) {
          context.commit('setGeoFacetsFilter', context.state.globalGeoFacets.map(f => true))
          await context.dispatch('setManualQueryField', []);
          return true
          // context.dispatch('setQueryField', {
          //   field: 'l1',
          //   and: false,
          //   list: [],
          //   rebuild: false,
          // })
          // context.dispatch('setQueryField', {
          //   field: 'l11',
          //   and: false,
          //   list: [],
          // })
        }
        return false
      }

      let visibleCoords = context.state.globalGeoFacets.map(f => false);
      let bucket = context.state.globalGeoFacets.map((f, i) => [f, i])

      let selectedPolys = context.getters.filterPolyList.filter(p => p.selected)
      selectedPolys.forEach(p => {
        let gpoly = new context.state.google.maps.Polygon({ paths: p.path })
        bucket = bucket.filter(([c, i]) => {
          const contains = context.state.google.maps.geometry.poly.containsLocation(
            new context.state.google.maps.LatLng(c.position.lat, c.position.lng),
            gpoly
          )
          if (contains) {
            visibleCoords[i] = true
          }
          return !contains
        })
      });
      if (!context.getters.geoFacetsFilterEqual(visibleCoords)) {
        context.commit('setGeoFacetsFilter', visibleCoords)
        let visible = context.getters.visibleGlobalGeoFacets
        // tried to just filter by marker, but url got too long
        // let latList = visible.map(cd => cd.position.lat)
        // let lngList = []
        // if (latList.length <= 55) {
        //   let lngList = visible.map(cd => cd.position.lng)
        //   context.dispatch('setQueryField', {
        //     field: 'l1',
        //     and: false,
        //     list: latList,
        //     rebuild: false,
        //   })
        //   context.dispatch('setQueryField', {
        //     field: 'l11',
        //     and: false,
        //     list: lngList,
        //   })
        // } else {
        // latList = []
        let manual = [context.state.apiSyntax.OR]
        selectedPolys.forEach(p => {
          let latBounds = [p.path[0].lat, p.path[0].lat]
          let lngBounds = [p.path[0].lng, p.path[0].lng]
          p.path.forEach(({lat, lng}) => {
            if (lat < latBounds[0]) {
              latBounds[0] = lat
            } else if (lat > latBounds[1]) {
              latBounds[1] = lat
            }
            if (lng < lngBounds[0]) {
              lngBounds[0] = lng
            } else if (lng > lngBounds[1]) {
              lngBounds[1] = lng
            }
          })
          manual.push([context.state.apiSyntax.AND, ['l1', ...latBounds], ['l11', ...lngBounds]]);
        })
        await context.dispatch('setManualQueryField', [manual]);
        return true
      }
      return false
    }, 200),
    sort(context, { field, asc = true }) {
      context.commit("setSort", { field, asc });
      context.commit("rebuildQuery");
      return context.dispatch("runNewQuery");
    },
    unsort(context) {
      context.commit("removeSort");
      context.commit("rebuildQuery");
      return context.dispatch("runNewQuery");
    },
    async _doQuery(context) {
      context.commit("setQueryLoading", true);
      if (context.state.abortController !== null) {
        context.state.abortController.abort();
      }
      const controller = new AbortController();
      const signal = controller.signal;
      context.commit("setAbortController", controller);
      let docs;
      try {
        docs = await context.state.query.quickFetch(signal);
      } catch (error) {
        if (error.name === "AbortError") {
          return false;
        }
        throw error;
      }
      if (!context.state.queryRan) {
        context.commit("setQueryRan", true);
      }
      context.commit("setQueryLoading", false);
      return docs;
    },
    async runNewQuery(context) {
      let query = context.state.query;

      await context.dispatch("_doQuery");

      context.commit("setGeoFacets", query.facet_counts);
      context.commit("setQueryMessage", query.msg);
      context.commit("setLastPage", query.lastPageNumber);
      // ensure map filtering is used before editing entries otherwise non-location entries won't show
      let total = query.total;
      let entries = [...query.results];
      if (context.state.manualQueryTerms.length > 0) {
        let geoByLat = context.getters.visibleGeoFacetsPosByLat
        entries = entries.filter(e => {
          if (e.l1 in geoByLat) {
            return e.l11 in geoByLat[e.l1]
          }
          return false
        })
        total = context.getters.visibleGeoFacets.reduce((prev, curr) => { return prev + curr.amount }, 0)
      }
      context.commit("setTotal", total);
      context.commit("setEntries", entries);
    },
    async more(context) {
      let query = context.state.query;
      if (!context.state.queryRan || !query.hasMorePages) {
        return false;
      }
      let res = await context.dispatch("_doQuery");
      if (res) {
        context.commit("addEntries", res);
      }
      return true;
    },
    setImageSize(context, payload) {
      context.commit("_setImgSize", {
        unique_id: payload.unique_id,
        getters: context.getters,
        size: payload.size,
        width: payload.width,
      });
    },
    async getEdgeValue(context, { field, min }) {
      const q = new Query({
        collections: [],
        queryTerms: [field, "*"],
        sort: field,
        asc: min,
      });
      return (await q.quickFetch())[0][field];
    },
  },
});
