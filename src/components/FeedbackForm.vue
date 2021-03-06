<template>
  <v-layout justify-center>
    <v-dialog v-model="dialog" max-width="600px">
      <template v-slot:activator="{ on }">
        <slot :on="on"></slot>
      </template>
        <v-card>
          <v-card-title>
            <span class="headline">Send us feedback</span>
          </v-card-title>
          <v-card-text>
            <v-container grid-list-md>
              <iframe width="0" height="0" border="0" style="border: none;" name="dummyframe" id="dummyframe"></iframe>
              <v-form
                lazy-validation
                v-model="valid"
                id="myForm"
                ref="form"
                method="post"
                :action="formUrl"
              >
                <!-- action="https://hooks.zapier.com/hooks/catch/3628424/obovo3m/"
                target="_blank" -->
              <v-layout wrap>
                <v-flex xs12 style="text-indent: 1em;">
                  This site is still in development.
                  Its future functionality and look and feel are based on your input,
                  so please let us know if there is anything you would like us to add, change, or fix.
                </v-flex>
                <v-flex xs12 sm6>
                  <v-select
                    name="occupations"
                    :items="this.objectify(occupations)"
                    v-model="selected_occupations"
                    :label="xs ? 'I\'m a..' : 'I\'m using this page as a..'"
                    multiple
                    :disabled="submitting"
                  ></v-select>
                </v-flex>
                <v-flex xs12 sm6>
                  <v-select
                    name="type"
                    :items="this.objectify(['issue/bug', 'suggestion'])"
                    v-model="issue"
                    :rules="[v => !!v || 'Please select one']"
                    :label="xs ? 'issue or suggestion?*' : 'Is this a bug or a suggestion?*'"
                    required
                    :disabled="submitting"

                  ></v-select>
                </v-flex>
                <v-flex xs12>
                  <v-text-field
                    name="title"
                    label="Title*"
                    v-model="title"
                    :rules="[v => !!v || 'Title is required']"
                    hint="Summary of your suggestion or bug"
                    :disabled="submitting"
                    required
                  ></v-text-field>
                </v-flex>
                <v-flex xs12>
                  <v-textarea
                    name="description"
                    label="Description*"
                    v-model="description"
                    :rules="[v => !!v || 'Description is required']"
                    hint="Detailed description of what you are experiencing or what you think should be changed. Please be as descriptive as you can."
                    required
                    :disabled="submitting"
                    auto-grow
                  ></v-textarea>
                </v-flex>
                <v-flex xs12>
                Open issues and suggestions can be viewed <a :href="githubLink" taget="_blank">on github</a>.
                If you would like to follow discussions on the issues you submit,
                please make an account there.
                </v-flex>
              </v-layout>
              </v-form>
            </v-container>
            <small>*indicates required field</small>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary darken-1" text @click="dialog = false">Cancel</v-btn>
            <v-btn color="primary darken-1" text @click="submit">Submit</v-btn>
          </v-card-actions>
          <v-progress-linear v-if="submitting" :indeterminate="true"></v-progress-linear>
        </v-card>
        <v-layout justify-center align-center text-xs-center>
          <v-dialog v-model="successMsg" max-width="200px">
            <v-card>
              <v-card-title primary-title>
                <span class="headline">Thanks! <v-icon color="success">done_outline</v-icon></span>
              </v-card-title>
            </v-card>
          </v-dialog>
        </v-layout>
    </v-dialog>
  </v-layout>
</template>

<script>
export default {
  data () {
    return {
      dialog: false,
      issue: null,
      description: null,
      title: null,
      occupations: [
        'researcher',
        'grad student',
        'professor',
        'student',
        'business',
        'hobbyist',
        'other'
      ],
      selected_occupations: [],
      valid: false,
      formUrl: process.env.FORM_URL,
      githubLink: process.env.ISSUE_PAGE_LINK,
      success: false,
      successMsg: false,
      submitting: false
    }
  },
  computed: {
    xs() {
      return this.$vuetify.breakpoint.name === 'xs';
    },
    is_issue() {
      return this.issue !== 'suggestion';
    },
    browserInfo() {
      // http://mrbool.com/how-to-detect-different-browsers-and-their-versions-using-javascript/25424
      // let objappVersion = navigator.appVersion;
      const objAgent = navigator.userAgent;
      let objbrowserName = navigator.appName;
      let objfullVersion = '' + parseFloat(navigator.appVersion);
      let objBrMajorVersion = parseInt(navigator.appVersion, 10);
      let objOffsetName;
      let objOffsetVersion;
      let ix;

      // In Chrome
      if ((objOffsetVersion=objAgent.indexOf("Chrome"))!=-1) {
      objbrowserName = "Chrome";
      objfullVersion = objAgent.substring(objOffsetVersion+7);
      }
      // In Microsoft internet explorer
      else if ((objOffsetVersion=objAgent.indexOf("MSIE"))!=-1) {
      objbrowserName = "Microsoft Internet Explorer";
      objfullVersion = objAgent.substring(objOffsetVersion+5);
      }

      // In Firefox
      else if ((objOffsetVersion=objAgent.indexOf("Firefox"))!=-1) {
      objbrowserName = "Firefox";
      }
      // In Safari
      else if ((objOffsetVersion=objAgent.indexOf("Safari"))!=-1) {
      objbrowserName = "Safari";
      objfullVersion = objAgent.substring(objOffsetVersion+7);
      if ((objOffsetVersion=objAgent.indexOf("Version"))!=-1)
        objfullVersion = objAgent.substring(objOffsetVersion+8);
      }
      // For other browser "name/version" is at the end of userAgent
      else if ( (objOffsetName=objAgent.lastIndexOf(' ')+1) <
                (objOffsetVersion=objAgent.lastIndexOf('/')) )
      {
      objbrowserName = objAgent.substring(objOffsetName,objOffsetVersion);
      objfullVersion = objAgent.substring(objOffsetVersion+1);
      if (objbrowserName.toLowerCase()==objbrowserName.toUpperCase()) {
        objbrowserName = navigator.appName;
      }
      }
      // trimming the fullVersion string at semicolon/space if present
      if ((ix=objfullVersion.indexOf(";"))!=-1)
        objfullVersion=objfullVersion.substring(0,ix);
      if ((ix=objfullVersion.indexOf(" "))!=-1)
        objfullVersion=objfullVersion.substring(0,ix);

      objBrMajorVersion = parseInt(''+objfullVersion,10);
      if (isNaN(objBrMajorVersion)) {
        objfullVersion  = ''+parseFloat(navigator.appVersion);
        objBrMajorVersion = parseInt(navigator.appVersion,10);
      }
      return `
      Browser name: ${objbrowserName}
      Full version: ${objfullVersion}
      Major version: ${objBrMajorVersion}

      navigator.appName: ${navigator.appName}
      navigator.userAgent: ${navigator.userAgent}`
    },
  },
  methods: {
    async submit () {
      if (this.submitting) {
        return false
      }
      if (this.$refs.form.validate()) {
        this.submitting = true
        let bi = this.browserInfo
        let resp = await fetch(this.formUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            occupations: this.selected_occupations,
            type: this.issue,
            title: this.title,
            description: this.description,
            browserInfo: bi
          })
        })
        if (resp.status==200) {
          this.submitting = false
          this.success = true
          this.successMsg = true
          setTimeout(() => {
            this.successMsg = false
            this.dialog = false
          }, 1000);
        } else {
          console.log('error in response', resp)
          this.submitting = false
        }
      }
      // this.$refs.form.submit()
    },
    objectify (li) {
      return li.map((i) => {
        return {
          text: i,
          value: i
        }
      })
    }
  }
}
</script>
