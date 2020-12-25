<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="300px"
  >
    <template v-slot:activator="{ on }">
      <slot name="activator" :on="on"></slot>
    </template>

    <v-card>
      <v-card-title class="headline">
        CSV Download
      </v-card-title>

      <v-card-text class="pt-0">
        Download the current search results as a CSV file?
        This may take awhile depending on the number of results.
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn flat color="primary" @click="cancel">cancel</v-btn>
        <v-btn
          flat dark color="primary"
          @click="download"
          :loading="loading"
        >ok</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default {
  data: () => ({
    dialog: false,
    loading: false,
  }),
  watch: {
    dialog() {
      // extra protection
      this.loading = false;
    },
  },
  computed: {
    ...mapState(['total', 'entries', 'dumpAborted']),
    ...mapGetters(['visibleColumns', 'imageUrl']),
  },
  methods: {
    cancel() {
      this.abortDump();
      this.loading = false;
      this.dialog = false;
    },
    async download() {
      this.loading = true;
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Sheet 1');
      const columnOrder = this.visibleColumns.map(c => c.solrname);
      const header = this.visibleColumns.map(c => c.title);

      sheet.addRow(header);

      await this.runDumpQuery();

      this.entries.forEach((e) => {
        if (!this.dumpAborted) {
          const row = columnOrder.map((cn) => {
            // img isn't a visible row, but maybe add the feature later
            if (cn === 'img') {
              return e[cn].map((img) => {
                return this.imageUrl(img.collection, img.filename, null);
              });
            }
            return e[cn];
          })
          sheet.addRow(row);
        }
      });

      if (!this.dumpAborted) {
        wb.csv.writeBuffer().then((data) => {
          const blob = new Blob([data], { type: 'application/csv' });
          saveAs(blob, 'export.csv');
        });
      }
      this.loading = false;
    },
    ...mapActions(['runDumpQuery', 'abortDump']),
  },
}
</script>
