const app = Vue.createApp({
    data() {
        return {
            total_hits: 0,
            current_hit: 1,
            hits_data: null,
            original_html: '',
            simplified_html: '',
        }
    },
    methods: {
        process_original_sentence() {
            let prev_idx = 0
            let sentence_html = ''
            let original_sentence = this.hits_data[this.current_hit - 1].original
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            // iterate original_spans list
            for (let i = 0; i < original_spans.length; i++) {
                sentence_html += original_sentence.substring(prev_idx, original_spans[i][1]);
                if (original_spans[i][0] == 0) {
                    sentence_html += `<span class="border-deletion">`;
                } else if (original_spans[i][0] == 1) {
                    sentence_html += `<span class="border-paraphrase">`;
                }
                sentence_html += original_sentence.substring(original_spans[i][1], original_spans[i][2]);
                sentence_html += `</span>`;
                prev_idx = original_spans[i][2];
            }
            sentence_html += original_sentence.substring(prev_idx);
            this.original_html = sentence_html;
        },
        process_simplified_sentence() {
            let prev_idx = 0
            let sentence_html = ''
            let simplified_sentence = this.hits_data[this.current_hit - 1].simplified
            let simplified_spans = this.hits_data[this.current_hit - 1].simplified_spans
            // iterate simplified_spans list
            for (let i = 0; i < simplified_spans.length; i++) {
                sentence_html += simplified_sentence.substring(prev_idx, simplified_spans[i][1]);
                if (simplified_spans[i][0] == 1) {
                    sentence_html += `<span class="border-paraphrase">`;
                } else if (simplified_spans[i][0] == 2) {
                    sentence_html += `<span class="border-addition">`;
                }
                sentence_html += simplified_sentence.substring(simplified_spans[i][1], simplified_spans[i][2]);
                sentence_html += `</span>`;
                prev_idx = simplified_spans[i][2];
            }
            sentence_html += simplified_sentence.substring(prev_idx);
            this.simplified_html = sentence_html;
        },
        next_hit() {
            this.current_hit = this.current_hit + 1
            if (this.current_hit > this.total_hits) {
                this.current_hit = this.total_hits
            }
            this.process_original_sentence()
        },
        prev_hit() {
            this.current_hit = this.current_hit - 1
            if (this.current_hit < 1) {
                this.current_hit = 1
            }
            this.process_original_sentence()
        }
    },
    created: function () {
        fetch("https://raw.githubusercontent.com/Yao-Dou/ts-annotation-tool/main/data/test.json")
          .then(r => r.json())
          .then(json => {
            this.hits_data=json;
            this.total_hits = json.length;
            this.process_original_sentence();
            this.process_simplified_sentence();
          });
        
    },
    mounted() {
        $(".language-button").on("click", this.language_button_click)
    },
})


app.mount('#app')