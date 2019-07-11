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
    return encodeURIComponent([...this.qs].sort().join(' AND '))
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
    let term = `${name}:`
    if (typeof endSearch === 'undefined') {
      term += search
    } else {
      term += `[${search} TO ${endSearch}]`
    }
    return term
  }
  _addQueryTerms(terms) {
    terms = (terms.constructor === Array) ? terms : [terms]
    return new Query(this.collections, [...this.qs, ...terms], this.params)
  }
  setBaseQuery(search) {
    return new Query(this.collections, [search, ...this.qs.slice(1)], this.params)
  }
  addTerm(name, search = '*', endSearch) {
    return this._addQueryTerms(this._qTerm(name, search, endSearch))
  }
  addParams(params) {
    return new Query(this.collections, this.qs, {
      ...this.params,
      ...params
    })
  }
  _copy() {
    return new Query(this.collections, this.qs, this.params)
  }
  sort(solrField, asc = true) { // what happens when one collection doesn't have the field?
    let ascDesc = asc ? 'asc' : 'desc'
    let param = {
      sort: `${solrField} ${ascDesc}`
    }
    return this.addParams(param)
  }
  setCollections(collections) {
    return new Query(collections, this.qs, this.params)
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
    geoFacetsOn: false,
    viewEntries: [],
    viewIndexes: {},
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
    setCustomSettings(state, settings) {
      state.customSettings = settings
    },
    setCollections(state, collections) {
      state.collections = collections
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
    alterQuery(context, newQuery) {
      context.commit('setQuery', newQuery)
    },
    setGeoFacets(context, toggle) {
      context.commit('setGeoFacetLoading', toggle)
    },
    updateViewEntries(context) {
      let state = context.state

      let indexes = { ...state.viewIndexes }
      let entries = state.entries

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

      let nextEntries = []

      while (true) {
        if (Object.keys(yetToView).length === 0) {
          break
        }
        let coll = randOnDistribution(normalizeDistribution(yetToView))
        decrView(yetToView, coll)
        let thisIndex = indexes[coll]
        let item = entries[coll].docs[thisIndex]
        if (item === undefined) {
          break
        }
        nextEntries.push(item)
        indexes[coll] += 1
      }

      context.commit('setViewIndexes', indexes)
      context.commit('setViewEntries', [...state.viewEntries, ...nextEntries])

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
      let query = context.state.query.cloneNumFound()
      if (context.state.geoFacetsOn) {
        query = query.geoCounts()
      }
      let results = await query.quickFetch()
      context.commit('setQuery', query)
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
      return getters.fieldList.filter(col => 'advancedsearch' in col && col.advancedsearch ===
        'true')
    },
    colAttrs(state, getters, solrName) {
      return getters.fieldList.find(col => col.solrname === solrName)
    },
    visibleCols(state, getters) {
      return getters.fieldList.filter(field => {
        return 'displaycolidx' in field
      }).sort((a, b) => {
        return a['displaycolidx'] - b['displaycolidx']
      })
    }
  }
})
