const app = Vue.createApp({
    data() {
        return {
            total_hits: 0,
            current_hit: 1,
            hits_data: null,
            original_sentence: '',
            simplified_sentence: ''
        }
    },
    methods: {
        next_hit() {
            this.current_hit = this.current_hit + 1
            if (this.current_hit > this.total_hits) {
                this.current_hit = this.total_hits
            }
        },
        prev_hit() {
            this.current_hit = this.current_hit - 1
            if (this.current_hit < 1) {
                this.current_hit = 1
            }
        }
    },
    created: function () {
        fetch("https://raw.githubusercontent.com/Yao-Dou/multipit_multilingual/main/data/jul_3-13_language_dict_with_sort_and_num_selection.json")
          .then(r => r.json())
          .then(json => {
            this.hits_data=json;
            this.total_hits = json.length;
          });
    },
    mounted() {
        $(".language-button").on("click", this.language_button_click)
    },
})


app.mount('#app')