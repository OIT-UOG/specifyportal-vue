import Vue from 'vue'
import Vuex from 'vuex'
import { normalize } from 'path';
const matchAll = require('string.prototype.matchall');
matchAll.shim()

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
  constructor(collections, queryTerms = ['*'], params = {}) {
    this.collections = [...collections]
    const qs = (queryTerms.constructor === Array) ? queryTerms : [queryTerms]
    this.qs = [...qs]
    this.params = {
      wt: 'json',
      rows: ROWS_PER_QUERY,
      page: 0, // nextPage/setPage() check prev page's cache for numFound. return null or something if no more pages
      start: 0,
      ...params
    }
    this.ran = false
    this.numFound = {}
  }
  get urls() { // url "hashes". duplicate queries must give same url for caching
    return this.collections.reduce((res, c) => {
      res[c] = this._hashUrl(c)
      return res
    }, {})
  }
  get qUrlParam() {
    let qs = [...this.qs]
    if (qs.length > 1 && qs[0] === '*') {
      qs = qs.slice(1)
    }
    return encodeURIComponent(qs.sort().join(' AND '))
  }
  get urlParams() {
    let params = {
      ...this.params
    }
    return [
      `q=${this.qUrlParam}`,
      ...Object.keys(params).sort().map(
        key => `${key}=${encodeURIComponent(params[key])}`
      )
    ].join('&')
  }
  _hashUrl(collection) {
    return `${BASE_SOLR_PATH}/${collection}/select?${this.urlParams}`
  }
  async quickFetch() { // fetch or get from cache
    let urls = this.urls // hmm promise all including cache
    let responses = await Promise.all(Object.keys(urls).map(async (coll) => {
      let lastPage = this.lastPageNumber(coll)

      if (lastPage && this.params.page > lastPage) {
        return null
      }

      let url = urls[coll]
      let resp = this.buildResponseFromCache(url)
      if (!resp) {
        // return null if no more pages
        let raw = await fetch(url)
        resp = this.processResponse(coll, await raw.json())
        this.putResponseInCache(url, coll, resp)
      }
      this.numFound[coll] = resp.numFound
      return resp
    }))
    this.ran = true
    return responses
  }
  putResponseInCache(url, coll, resp) {
    if (!(coll in cache.result_list)) {
      cache.result_list[coll] = {}
    }
    let cacheObj = JSON.parse(JSON.stringify(resp)) // copy

    cacheObj.docs = cacheObj.docs.map(doc => {
      cache.result_list[coll][doc.spid] = doc
      return doc.spid
    })
    cache.query_list[url] = cacheObj
  }
  buildResponseFromCache(url) {
    if (url in cache.query_list) {
      let cacheObj = JSON.parse(JSON.stringify(cache.query_list[url]))

      cacheObj.docs = cacheObj.docs.map(spid => {
        return cache.result_list[cacheObj.collection][spid]
      })
      return cacheObj
    } else {
      return null
    }
  }
  processResponse(collection, r) {
    if ('facet_counts' in r) {
      r.response.facet_counts = r.facet_counts
    }
    r = r.response
    r.docs = r.docs.map(doc => {
      doc.coll = collection.replace('vouchers', '')
      if ('img' in doc) {
        doc.img = this._parseImages(collection, doc)
      }
      return doc
    })
    r.collection = collection
    return r
  }
  _parseImages(collection, specimen) {
    let imgsString = specimen.img
    let spid = specimen.spid
    let inObject = false
    let inString = false
    let inKey
    let imgs = []
    let current
    let keyBuffer
    let valueBuffer
    let keyDict = {
      AttachmentID: 'id',
      AttachmentLocation: 'location',
      Title: 'title'
    }
    for (let i = 0; i < imgsString.length; i++) {
      let c = imgsString.charAt(i)
      if (!inObject) {
        if (c === '{') {
          inObject = true
          inKey = true
          keyBuffer = ''
          valueBuffer = ''
          current = {}
        }
      } else {
        if (!inString) {
          if (c === '}' || c === ',') { // value end
            if (keyBuffer in keyDict) {
              current[keyDict[keyBuffer]] = valueBuffer
            }
            keyBuffer = ''
            valueBuffer = ''
          }
          if (c === '}') { // object end
            inObject = false
            if (current) {
              imgs.push(new Image(collection, spid, current.id, current.location, current.title))
              current = undefined
            }
            continue
          } else if (c === ':') { // key end
            inKey = false
            continue
          } else if (c === ',') { // value end but not object end
            inKey = true
            continue
          } else if (c === '"') { // string start
            inString = true
            continue
          } else if (c === ' ') {
            continue
          }
        }
        if (c === '"') {
          inString = false
        } else {
          if (inKey) {
            keyBuffer += c
          } else {
            valueBuffer += c
          }
        }
      }
    }
    return imgs
  }
  get hasGeoCount() {
    return this.params['facet'] === 'on'
  }
  get isCachable() {
    return !this.hasGeoCount
  }
  isLastPage(coll) {
    return this.params.page === this.lastPageNumber(coll)
  }
  lastPageNumber(coll) {
    if (typeof this.numFound[coll] === 'undefined') {
      return null
    }
    return Math.ceil(this.numFound[coll] / ROWS_PER_QUERY) - 1
  }
  hasMorePages() {
    for (let coll of this.collections) {
      if (this.params.page < this.lastPageNumber(coll)) {
        return true
      }
    }
    return false
  }
  cloneNumFound(other) {
    other = other || this
    let copy = this._copy()
    copy.numFound = {...other.numFound}
    return copy
  }
  setPage(page) {
    // check cache here. { run: () => null } ?
    // return null if no more pages
    let nextQuery = this.addParams({
      rows: this.params.rows,
      page: page,
      start: this.params.rows * page
    }).cloneNumFound(this)
      // I don't remember if I wanted them to share this object
      // or have a deep clone
    return nextQuery
  }
  nextPage() {
    return this.setPage(this.params.page + 1)
  }
  prevPage() {
    return this.setPage(Math.max(0, this.params.page - 1))
  }
  _qTerm(name, search, endSearch) {
    let term = `${name.toLowerCase()}:`
    if (typeof endSearch === 'undefined') {
      term += (''+search).toLowerCase()
    } else {
      term += `[${(''+search).toLowerCase()} TO ${(''+endSearch).toLowerCase()}]`
    }
    return term
  }
  _addQueryTerms(terms) {
    terms = (terms.constructor === Array) ? terms : [terms]
    return this.newQueryFromFreshClone({qs: terms})
  }
  setBaseQuery(search) {
    return this.newQueryFromFreshClone({
      qs: [search.toLowerCase(), ...this.qs.slice(1)],
      override_qs: true
    })
  }
  _termIndex(name) {
    return ['', ...this.qs.slice(1)].findIndex((qt) => {
      return name == qt.split(':')[0]
    })
  }
  getTerm(name) {
    let index = this._termIndex(name)
    if (index < 0) { return false }
    let term = this.qs[index].split(':')
    let search = term[1]
    let to = undefined
    if (search[0]=='[' && search[search.length-1]==']') {
      [search, to] = search.slice(1,-1).split(' TO ')
    }
    let ret = {
      field: term[0],
      search,
      to
    }
    return ret
  }
  addTerm(name, search = '*', endSearch) {
    let index = this._termIndex(name)
    let term = this._qTerm(name, search, endSearch)
    if (index >= 0) {
      return this.newQueryFromFreshClone({
        qs: [...this.qs.slice(0,index), term, ...this.qs.slice(index+1)],
        override_qs: true
      })
    }
    return this._addQueryTerms(this._qTerm(name, search, endSearch))
  }
  removeTerm(name) {
    let index = this._termIndex(name)
    if (index >= 0) {
      return this.newQueryFromFreshClone({
        qs: [...this.qs.slice(0,index), ...this.qs.slice(index+1)],
        override_qs: true
      })
    }
    return this
  }
  addParams(params) {
    return this.newQueryFromFreshClone({params})
  }
  removeParam(key) {
    let q = this.cloneFreshQuery()
    delete q.params[key]
    return q
  }
  _copy() {
    return new Query(this.collections, this.qs, this.params)
  }
  cloneFreshQuery() {
    let q = this._copy()
    q.params.page = 0
    q.params.start = 0
    return q
  }
  newQueryFromFreshClone({collections=[], qs=[], params={},
                          override_collections=false,
                          override_qs=false,
                          override_params=false}) {
    let q = this.cloneFreshQuery()
    return new Query(
      override_collections ? collections : [...q.collections, ...collections],
      override_qs ? qs :                   [...q.qs, ...qs],
      override_params ? params :           {...q.params, ...params}
    )
  }
  sort(solrField, asc = true) { // what happens when one collection doesn't have the field?
    let ascDesc = asc ? 'asc' : 'desc'
    let param = {
      sort: `${solrField} ${ascDesc}`
    }
    return this.addParams(param)
  }
  unsort() {
    return this.removeParam('sort')
  }
  getSort() {
    let [field, asc] = ('sort' in this.params)? this.params.sort.split(' ') : [false, false]
    if (field) {
      asc = asc === 'asc'
    }
    return {
      field,
      asc
    }
  }
  setCollections(collections) {
    return this.newQueryFromFreshClone({
      collections,
      override_collections: true
    })
  }
  imagesOnly() {
    return this.addTerm('img')
  }
  geoOnly() {
    return this.addTerm('l1', -180, 180).addTerm('l11', -180, 180)
  }
  geoCounts() {
    return this.addParams({
      facet: 'on',
      'facet.field': 'geoc',
      'facet.limit': -1,
      'facet.mincount': 1
    })
  }
}

async function scrapeCollections() {
  let raw = await fetch(`${BASE_SOLR_PATH}/`)
  let text = await raw.text()

  return [...text.matchAll(/<li><a href="(.*?)"/g)].map(r => r[1])
}

async function readFields(coll) {
  let raw = await fetch(`${BASE_SOLR_PATH}/${coll}/resources/config/fldmodel.json`)
  return raw.json()
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


// oops, this is a regular object, not a Vue object.
// we'll need to move the querying and all this to a separate component.
// might need to rewrite this using Vuex instead of this const data store
export default new Vuex.Store({
  state: {
    loaded: false,
    customSettings: {},
    collections: [],
    fields: {},
    entries: {},
    query: new Query([]),
    queryLoading: false,
    geoFacetsOn: false,
    viewEntries: [],
    viewIndexes: {},
    collectionSort: false,
  },
  mutations: {
    setQueryNextPage(state) {
      if (state.query.ran) {
        state.query = state.query.nextPage()
      }
    },
    setQuery(state, newQuery) {
      state.query = newQuery
    },
    setQueryLoading(state, loading) {
      state.queryLoading = loading
    },
    setEntries(state, newEntries) {
      console.log(newEntries)
      state.entries = newEntries // do I need to do these individually?
    },
    addEntries(state, additionalEntries) {
      Object.keys(additionalEntries).forEach(coll => {
        let add = additionalEntries[coll]
        if (add != null) {
          state.entries[coll].start = add.start
          state.entries[coll].docs.push(...add.docs)
        }
      })
      // do I need to use the same array?
    },
    setViewEntries(state, entries) {
      state.viewEntries = entries
    },
    setViewIndexes(state, indexes) {
      state.viewIndexes = indexes
    },
    resetViewIndexes(state) {
      state.viewIndexes = state.collections.reduce((acc, coll) => {
        acc[coll] = 0
        return acc
      },{})
    },
    setFields(state, fields) {
      state.fields = fields
    },
    setFieldResultVisibility(state, {solrname, visibleInResults}) {
      state.fields[solrname].visibleInResults = visibleInResults
    },
    setCustomSettings(state, settings) {
      state.customSettings = settings
    },
    setCollections(state, collections) {
      state.collections = collections
    },
    setCollectionSort(state, asc) {
      state.collectionSort = { asc }
    },
    setCollectionUnsort(state) {
      state.collectionSort = false
    },
    setLoadingState(state, loaded) {
      state.loaded = loaded
    },
    setGeoFacetLoading(state, value) {
      state.geoFacetsOn = !!value
    },
    _setImgSize(state, payload) {
      let img = payload.getters.getImage(payload.unique_id)
      img.sizeRatio = payload.size
      img.width = payload.px
    },
  },
  actions: {
    newSearchTerm(context, search) {
      context.dispatch('alterQuery',
        context.state.query.setBaseQuery(search)
      )
    },
    addSearchTerm(context, { field, search, to = undefined }) {
      console.log('q', field, search, to)
      context.dispatch('alterQuery',
        context.state.query.addTerm(field, search, to)
      )
    },
    removeSearchTerm(context, field) {
      context.dispatch('alterQuery',
        context.state.query.removeTerm(field)
      )
    },
    alterQuery(context, newQuery) {
      context.commit('setQuery', newQuery)
    },
    setGeoFacets(context, toggle) {
      context.commit('setGeoFacetLoading', toggle)
    },
    sort(context, { field, asc = true }) {
      if (field === 'coll') {
        context.commit('setCollectionSort', asc)
        context.dispatch('runNewQuery', context.state.query.unsort())
      } else {
        context.commit('setCollectionUnsort')
        context.dispatch('runNewQuery', context.state.query.sort(field, asc))
      }
    },
    unsort(context) {
      if (context.state.collectionSort) {
        context.commit('setCollectionUnsort')
      }
      context.dispatch('runNewQuery', context.state.query.unsort())
    },
    updateViewEntries({ state, getters, commit }) {

      let indexes = { ...state.viewIndexes }
      let entries = state.entries

      let {field: sortField, asc: sortAsc} = getters.getSort

      let yetToView = Object.entries(state.query.numFound).reduce((acc, [coll, val]) => {
        let nval = val - indexes[coll]
        if (nval > 0) {
          acc[coll] = nval
        }
        return acc
      }, {})

      const normalizeDistribution = (dist) => {
        let sum = Object.values(dist).reduce((a, b) => a + b, 0)
        return Object.entries(dist).reduce((acc, [k, v]) => {
          acc[k] = v / sum
          return acc
        }, {})
      }
      const randOnDistribution = (normDist) => {
        let r = Math.random()
        let isum = 0
        let [res, vi] = Object.entries(normDist).find(([k, v]) => {
          isum += v
          return r <= isum
        })
        return res
      }
      const decrView = (ytv, col) => {
        ytv[col] -= 1
        if (ytv[col] <= 0) {
          delete ytv[col]
        }
      }
      const inOrder = (a, b) => {
        if (!a) { return true }
        if (!b) { return false }
        [a, b] = [a, b].map(c => c[sortField])
        // if one is a string
        if ([a, b].map(a => typeof a).includes('string')) {
          // check if it's just a number
          if ([a, b].some(a => String(Number(a)) === a)) {
            [a, b] = [a, b].map(Number)
          } else {
            [a, b] = [a, b].map(String)
          }
        }
        return sortAsc ? a < b : b < a
      }
      const nextSortedCollection = (indexes, collections) => {
        return collections.map((coll) => {
          return [coll, entries[coll].docs[indexes[coll]]]
        }).reduce((prev, curr) => {
          return inOrder(prev[1], curr[1]) ? prev : curr
        })[0]
      }

      let nextEntries = []

      while (true) {
        if (Object.keys(yetToView).length === 0) {
          break
        }
        let coll = sortField ? nextSortedCollection(indexes, Object.keys(yetToView)) : randOnDistribution(normalizeDistribution(
          yetToView))
        let thisIndex = indexes[coll]
        let item = entries[coll].docs[thisIndex]
        if (item === undefined) {
          break
        }
        decrView(yetToView, coll)
        nextEntries.push(item)
        indexes[coll] += 1
      }

      commit('setViewIndexes', indexes)
      commit('setViewEntries', [...state.viewEntries, ...nextEntries])

      console.log(indexes)
      console.log(nextEntries)
    },
    async runNewQuery(context, query = false) {
      if (!query) {
        query = context.state.query
      } else {
        context.commit('setQuery', query)
      }

      let results = await context.dispatch('_doQuery')
      context.commit('resetViewIndexes')
      context.commit('setViewEntries', [])
      context.commit('setEntries', results)
      context.dispatch('updateViewEntries')
    },
    async more(context) {
      let query = context.state.query
      if (!query.ran || !query.hasMorePages()) {
        return false
      }
      context.commit('setQueryNextPage')
      let results = await context.dispatch('_doQuery')
      context.commit('addEntries', results)
      context.dispatch('updateViewEntries')
      return true
    },
    async _doQuery(context) {
      context.commit('setQueryLoading', true)
      let query = context.state.query.cloneNumFound()
      if (context.state.geoFacetsOn) {
        query = query.geoCounts()
      }
      let results = await query.quickFetch()
      context.commit('setQuery', query)
      context.commit('setQueryLoading', false)
      return resultObject(results)
    },
    setImageSize(context, payload) {
      context.commit('_setImgSize', {
        unique_id: payload.unique_id,
        getters: context.getters,
        size: payload.size,
        width: payload.width
      })
    },
    async loadSettings(context) {
      context.commit('setCollections', await scrapeCollections())
      context.commit('setQuery', context.state.query = new Query(context.state.collections))
      let fieldData = await Promise.all(
        context.state.collections.map(coll => readFields(coll))
      )
      // lots of uncertainty can be introduced by using a single field set
      // especially since we're not really paying attention to the order they're overwriting each other

      const collectionField = {
        "colname": "Collection",
        "solrname": "coll",
        "solrtype": "string",
        "title": "Collection",
        "type": "java.lang.String",
        "width": 50,
        "concept": "Collection",
        "sptable": null,
        "sptabletitle": "Collection",
        "spfld": null,
        "spfldtitle": null,
        "colidx": -1,
        "advancedsearch": "true",
        "displaycolidx": -1
      }
      let fields = [collectionField, ...fieldData.flat()].reduce((acc, field) => {
        acc[field.solrname] = field
        field.advancedsearch = field.advancedsearch ? true : false
        if (field.title === 'determinations') {
          field.advancedsearch = false
        }
        if (!('title' in field)) {
          field.title =  field.colname
        }
        field.visibleInResults = field.advancedsearch
        return acc
      }, {})
      context.commit('setFields', fields)

      let customSettingsData = await Promise.all(
        context.state.collections.map(async (coll) => {
          let resp = await fetch(
            `${BASE_SOLR_PATH}/${coll}/resources/config/settings.json`);
          return (await resp.json())[0]
        })
      )
      let customSettings = {}
      context.state.collections.forEach((coll, i) => {
        customSettings[coll] = customSettingsData[i]
      })
      context.commit('setCustomSettings', customSettings)
      context.commit('setLoadingState', true)
    }
  },
  getters: {
    numFound(state) {
      return Object.keys(state.entries).reduce((acc, coll) => {
        acc += state.entries[coll].numFound
        return acc
      }, 0)
    },
    entries(state) {
      let entries = state.entries
      let ent = Object.keys(entries).reduce((acc, coll) => {
        if (entries[coll] != null) {
          acc.push(...entries[coll].docs.map(entry => {
            // entry.coll = coll.replace('vouchers', '')
            return entry
          }))
        }
        return acc
      }, [])
      console.log(ent)
      return ent
    },
    getImage: (state, getters) => (unique_id) => {
      return getters.images.find((img)=>{
        return img.unique_id === unique_id
      })
    },
    getImageSize: (state, getters) => (unique_id) => {

      return getters.getImage(unique_id).sizeRatio
    },
    getImageWidth: (state, getters) => (unique_id) => {
      return getters.getImage(unique_id).width
    },
    images(state, getters) {
      return getters.entries.reduce((acc, s) => {
        if ('img' in s) {
          acc.push(...s.img)
        }
        return acc
      }, [])
    },
    viewImages(state) {
      return state.viewEntries.reduce((acc, s) => {
        if ('img' in s) {
          acc.push(...s.img)
        }
        return acc
      }, [])
    },
    geoFacets(state) {
      let entries = state.entries
      let facets = Object.keys(entries).reduce((acc, coll) => {
        // console.log(coll)
        // console.log(entries)
        if (entries[coll] != null && entries[coll].facet_counts != null) {
          let geoc = entries[coll].facet_counts.facet_fields.geoc
          // console.log(geoc)
          for (let i = 0; i < geoc.length; i += 2) {
            let [lat, long] = geoc[i].split(' ').map(parseFloat)
            acc.push(
              {
                position: {
                  lat: lat,
                  lng: long,
                },
                amount: geoc[i + 1],
                collection: coll,
              }
            )
          }
        }
        return acc
      }, [])
      // console.log('facets', facets)
      return facets
    },
    getSpecimenById: (state, getters) => (collection, spid) => {
      return cache.result_list[collection][spid] || getters.entries.find(e => e.spid === spid)
    },
    getSort(state) {
      if (state.collectionSort) {
        return {
          field: 'coll',
          ...state.collectionSort
        }
      }
      return state.query.getSort()
    },
    moreToQuery(state) {
      console.log(state.query)
      console.log(state.query.hasMorePages)
      return state.query.hasMorePages()
    },
    collectionSettings: (state) => (coll) => {
      return state.customSettings[coll]
    },
    imageUrl: (state, getters) => (coll, filename, size = 200) => {
      let settings = getters.collectionSettings(coll)
      let baseUrl = settings.imageBaseUrl
      let collName = encodeURIComponent(settings.collectionName)
      return `${baseUrl}/fileget?coll=${collName}&type=T&filename=${filename}&scale=${size}`
    },
    fieldList(state) {
      return Object.keys(state.fields).map(key => state.fields[key])
    },
    advancedSearchColumns(state, getters) {
      return getters.fieldList.filter(col => col.advancedsearch)
    },
    colAttrs(state, getters, solrName) {
      return getters.fieldList.find(col => col.solrname === solrName)
    },
    allCols(state, getters) {
      return getters.fieldList.filter(field => {
        return 'displaycolidx' in field
      }).sort((a, b) => {
        return a['displaycolidx'] - b['displaycolidx']
      }).concat(
        getters.fieldList.filter(field => {
          return !('displaycolidx' in field)
        }).sort((a, b) => {
          return a.title > b.title? 1 : -1
        })
      )
    },
    visibleCols(state, getters) {
      return getters.allCols.filter(field => {
        return field.visibleInResults
      })
    }
  }
})
