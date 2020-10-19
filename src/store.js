import Vue from 'vue'
import Vuex from 'vuex'
import { normalize } from 'path';

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
      if ("error" in res.detail && res.detail.error.code === 400) {
        this.results = [];
        this.total = 0;
        this.lastPageNumber = -1;
        this.facet_counts = [];
        this.msg = "Error in query";
        return [];
      } else if (res.detail.startsWith("last page is -1, requested page was")) {
        this.results = [];
        this.total = 0;
        this.lastPageNumber = -1;
        this.facet_counts = [];
        this.msg = "No data available";
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


export default new Vuex.Store({
  state: {
    // general states
    drawer: true,
    cardOpen: false,

    // api states
    loaded: false,
    query: null,
    queryTerms: {},
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
    total: null, // fill this
    lastPage: null, // fill this
    // abort stuff. not sure if this saves api flops
    abortController: null,
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
    setFieldResultVisibility(state, {solrname, visibleInResults}) {
      state.fields[solrname].visibleInResults = visibleInResults
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
      }

      const fs = Object.entries(state.queryTerms).filter(([field, {and, list}]) => {
        return field !== 'coll' && list.length > 0
      }).map(([field, {and, list}]) => {
        return [
          and ? state.apiSyntax.AND : state.apiSyntax.OR,
          ...list.map((item) => {
            return Array.isArray(item) ? [field, ...item] : [field, item]
          })
        ]
      })
      const queryTerms = [
        state.apiSyntax.AND,
        ...state.searchTerms,
        ...fs,
      ]
      params.queryTerms = queryTerms

      if (state.sort.field !== null) {
        params.sort = state.sort.field
        params.asc = state.sort.asc
      }

      state.query = new Query(params)
      state.queryMessage = null;
      state.queryRan = false;
    },
    setSearchTerms(state, terms) {
      state.searchTerms = (terms && terms.length !== 0) ? terms : ["*"];
    },
    setSort(state, {field, asc}) {
      state.sort = {
        field: field,
        asc: asc,
      }
    },
    removeSort(state) {
      state.sort = {
        field: null,
        asc: false,
      }
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
      return JSON.parse(JSON.stringify(state.queryTerms[field]))
    },
    getSpecimenById: (state, getters) => (collection, spid) => {
      return state.entries.find((e) => e.spid === spid);
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
  },
  actions: {
    async loadSettings(context, apiUrl) {
      API_URL = apiUrl;
      let resp = await fetch(API_URL + "/model");
      let fields = await resp.json();

      let fieldMap = fields.reduce((acc, field) => {
        acc[field.solrname] = field;
        if (field.title === "determinations") {
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
        })
      })

      resp = await fetch(API_URL + "/settings");
      let settings = await resp.json();

      context.commit("setSettings", settings.collections);
      context.commit("setSyntax", settings.search_syntax);

      context.commit("setLoadingState", true);
    },
    setDrawer(context, open) {
      context.commit("setDrawer", open);
    },
    setCardOpen(context, open) {
      context.commit("setCardOpen", open);
    },
    setSearchTerms(context, searches) {
      context.commit('setSearchTerms', searches);
      context.commit('rebuildQuery');
      return context.dispatch('runNewQuery');
    },
    // debounce this for sliders
    // how to do async vs no async versions?
    setQueryField(context, { field, and, list }) {
      context.commit('setQueryField', { field, and, list });
      context.commit('rebuildQuery');
      return context.dispatch('runNewQuery');
    },
    sort(context, { field, asc = true }) {
      context.commit('setSort', { field, asc });
      context.commit('rebuildQuery');
      return context.dispatch('runNewQuery');
    },
    unsort(context) {
      context.commit('removeSort');
      context.commit('rebuildQuery');
      return context.dispatch('runNewQuery');
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
        docs = await context.state.query.quickFetch(signal);[0]
      } catch (error) {
        if (error.name === 'AbortError') {
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

      context.commit("setEntries", [...query.results]);
      context.commit("setGeoFacets", query.facet_counts);
      context.commit("setTotal", query.total);
      context.commit("setLastPage", query.lastPageNumber);
      context.commit("setQueryMessage", query.msg);
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
    async getEdgeValue(context, {field, min}) {
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
