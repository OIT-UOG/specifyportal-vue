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
      submitting: false
    }
  },
  computed: {
    xs () {
      return this.$vuetify.breakpoint.name=='xs'
    },
    is_issue () {
      return this.issue != 'suggestion'
    }
  },
  methods: {
    async submit () {
      if (this.$refs.form.validate()) {
        this.submitting = true
        console.log(this.formUrl)
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
            description: this.description
          })
        })
        if (resp.status==200) {
          this.submitting = false
          this.dialog = false
          this.success = true
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