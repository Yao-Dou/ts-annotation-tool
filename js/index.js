const app = Vue.createApp({
    data() {
        return {
            total_hits: 0,
            current_hit: 1,
            hits_data: null,
            original_html: '',
            simplified_html: '',
            edits_html: '',
            annotations_dict: { 'deletion': {}, 'paraphrase': {}, 'insertion': {}, 'split': {}},
            edits_dict: { 'deletion': {}, 'paraphrase': {}, 'insertion': [], 'split':{}},
            single_edit_html: '',
            enable_select_original_sentence: false,
            enable_select_simplified_sentence: false,
            selected_span_in_original: '',
            selected_span_in_simplified: '',
        }
    },
    methods: {
        process_original_html() {
            let prev_idx = 0
            let sentence_html = ''
            let original_sentence = this.hits_data[this.current_hit - 1].original
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            // iterate original_spans list
            for (let i = 0; i < original_spans.length; i++) {
                sentence_html += original_sentence.substring(prev_idx, original_spans[i][1]);
                if (original_spans[i][0] == 0) {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="deletion border-deletion pointer span" data-category="deletion" data-id="deletion-` + original_spans[i][3] + `">`;
                } else if (original_spans[i][0] == 1) {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="paraphrase border-paraphrase pointer span" data-category="paraphrase" data-id="paraphrase-` + original_spans[i][3] + `">`;
                }
                sentence_html += original_sentence.substring(original_spans[i][1], original_spans[i][2]);
                sentence_html += `</span>`;
                prev_idx = original_spans[i][2];
            }
            sentence_html += original_sentence.substring(prev_idx);
            this.original_html = sentence_html;
        },
        process_simplified_html() {
            let prev_idx = 0
            let sentence_html = ''
            let simplified_sentence = this.hits_data[this.current_hit - 1].simplified
            let simplified_spans = this.hits_data[this.current_hit - 1].simplified_spans
            // iterate simplified_spans list
            for (let i = 0; i < simplified_spans.length; i++) {
                sentence_html += simplified_sentence.substring(prev_idx, simplified_spans[i][1]);
                if (simplified_spans[i][0] == 1) {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="paraphrase border-paraphrase pointer span" data-category="paraphrase" data-id="paraphrase-` + simplified_spans[i][3] + `">`;
                } else if (simplified_spans[i][0] == 2) {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="split border-split pointer span" data-category="split" data-id="split-` + simplified_spans[i][3] + `">`;
                } else if (simplified_spans[i][0] == 3) {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="insertion border-insertion pointer span" data-category="insertion" data-id="insertion-` + simplified_spans[i][3] + `">`;
                }
                sentence_html += simplified_sentence.substring(simplified_spans[i][1], simplified_spans[i][2]);
                sentence_html += `</span>`;
                prev_idx = simplified_spans[i][2];
            }
            sentence_html += simplified_sentence.substring(prev_idx);
            this.simplified_html = sentence_html;
        },
        process_edits_html() {
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            let simplified_spans = this.hits_data[this.current_hit - 1].simplified_spans
            let new_html = ''
            for (let i = 0; i < original_spans.length; i++) {
                if (original_spans[i][0] == 0) {
                    this.edits_dict['deletion'][original_spans[i][3]] = original_spans[i];
                } else if (original_spans[i][0] == 1) {
                    this.edits_dict['paraphrase'][original_spans[i][3]] = [original_spans[i]];
                }
            }
            for (let i = 0; i < simplified_spans.length; i++) {
                if (simplified_spans[i][0] == 2) {
                    this.edits_dict['split'][original_spans[i][3]] = original_spans[i];
                } else if (simplified_spans[i][0] == 3) {
                    this.edits_dict['insertion'][original_spans[i][3]] = original_spans[i];
                } else if (simplified_spans[i][0] == 1) {
                    this.edits_dict['paraphrase'][simplified_spans[i][3]].push(simplified_spans[i]);
                }
            }
            for (let i = 0; i < this.edits_dict['deletion'].length; i++) {
                new_html += `<div class='cf'>`
                new_html += `<div class="fl w-80 mb4 edit">`;
                new_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" data-id="deletion-${i}" data-category="deletion">`
                new_html += `<span class="edit-type txt-deletion f3">delete </span>`;
                new_html += `<span class="pa1 edit-text br-pill-ns txt-deletion border-deletion-all deletion_below" data-id="deletion-${i}" data-category="deletion">`;
                new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(this.edits_dict['deletion'][i][1], this.edits_dict['deletion'][i][2])}&nbsp`;
                new_html += `</span>`;
                new_html += ` : `;
                if (this.annotations_dict['deletion'][i] == null) {
                    new_html += `<span class="f4 i">this edit is not annotated yet, click to start!</span>`;
                }
                new_html += '</span>'
                new_html += `</div>`;
                new_html += `<div class="fl w-20 mb4 operation tc">`;
                new_html += `<i class="fa-solid fa-pencil mr3 pointer dim"></i>`;
                new_html += `<i class="fa-solid fa-trash-can ml4 pointer dim"></i>`;
                new_html += `</div>`;
                new_html += `</div>`;
            }
            for (let paraphrase_id in this.edits_dict['paraphrase']) {
                new_html += `<div class='cf'>`
                new_html += `<div class="fl w-80 mb4 edit">`;
                new_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" data-id="paraphrase-${paraphrase_id}" data-category="paraphrase">`
                new_html += `<span class="edit-type txt-paraphrase f3">paraphrase </span>`;
                new_html += `<span class="pa1 edit-text br-pill-ns txt-paraphrase border-paraphrase-all paraphrase_below" data-id="paraphrase-${paraphrase_id}" data-category="paraphrase">`;
                new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(this.edits_dict['paraphrase'][paraphrase_id][0][1], this.edits_dict['paraphrase'][paraphrase_id][0][2])}&nbsp`;
                new_html += `</span>`;
                new_html += `<span class="edit-type txt-paraphrase f3"> to </span>`;
                new_html += `<span class="pa1 edit-text br-pill-ns txt-paraphrase border-paraphrase-all paraphrase_below" data-id="paraphrase-${paraphrase_id}" data-category="paraphrase">`;
                new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(this.edits_dict['paraphrase'][paraphrase_id][1][1], this.edits_dict['paraphrase'][paraphrase_id][1][2])}&nbsp`;
                new_html += `</span>`;
                new_html += ` : `;
                if (this.annotations_dict['paraphrase'][paraphrase_id] == null) {
                    new_html += `<span class="f4 i">this edit is not annotated yet, click to start!</span>`;
                }
                new_html += '</span>'
                new_html += `</div>`;
                new_html += `<div class="fl w-20 mb4 operation tc">`;
                new_html += `<i class="fa-solid fa-pencil mr3 pointer dim"></i>`;
                new_html += `<i class="fa-solid fa-trash-can ml4 pointer dim"></i>`;
                new_html += `</div>`;
                new_html += `</div>`;
            }
            this.edits_html = new_html;
        },
        process_everything() {
            this.process_original_html();
            this.process_simplified_html();
            this.process_edits_html();
        },
        next_hit() {
            this.current_hit = this.current_hit + 1
            if (this.current_hit > this.total_hits) {
                this.current_hit = this.total_hits
            }
            this.process_everything();
        },
        prev_hit() {
            this.current_hit = this.current_hit - 1
            if (this.current_hit < 1) {
                this.current_hit = 1
            }
            this.process_everything();
        },
        cancel_click() {
            $('.quality-selection').slideUp(400);
        },
        show_span_selection(event) {
            $(`.span-selection-div`).hide();
            $(`.span-selection-div[data-category=${event.target.value}]`).slideDown(400);
            if (event.target.value == 'deletion') {
                this.enable_select_original_sentence = true;
                this.enable_select_simplified_sentence = false;
            }  else if (event.target.value == 'paraphrase') {
                this.enable_select_original_sentence = true;
                this.enable_select_simplified_sentence = true;
            } else {
                this.enable_select_simplified_sentence = true;
                this.enable_select_original_sentence = false;
            }
        }
    },
    created: function () {
        fetch("https://raw.githubusercontent.com/Yao-Dou/ts-annotation-tool/main/data/test.json")
            .then(r => r.json())
            .then(json => {
                this.hits_data = json;
                this.total_hits = json.length;
                this.process_everything();
            });

    },
    mounted: function () {
        // $(".quality-selection").draggable();

        $("#close-icon").on("click", function () {
            $(".quality-selection").fadeOut(0.2);
        });
    },
    computed: {
        compiled_original_html() {
            return {
                template: `<div @mousedown='deselect_original_html' @mouseup='select_original_html' id="original-sentence" class="f4 lh-copy">${this.original_html}</div>`,
                methods: {
                    hover_span(event) {
                        let category = event.target.dataset.category
                        if (category == 'paraphrase') {
                            let paraphrase_spans = $(`.paraphrase[data-id=${event.target.dataset.id}]`)
                            paraphrase_spans.addClass("white")
                            paraphrase_spans.addClass("bg-paraphrase")
                            let paraphrase_below_spans = $(`.paraphrase_below[data-id=${event.target.dataset.id}]`)
                            paraphrase_below_spans.addClass("white")
                            paraphrase_below_spans.addClass("bg-paraphrase")
                            paraphrase_below_spans.removeClass("txt-paraphrase")
                        } else if (category == 'deletion') {
                            let deletion_spans = $(event.target)
                            deletion_spans.addClass("white")
                            deletion_spans.addClass("bg-deletion")
                            let deletion_below_spans = $(`.deletion_below[data-id=${event.target.dataset.id}]`)
                            deletion_below_spans.addClass("white")
                            deletion_below_spans.addClass("bg-deletion")
                            deletion_below_spans.removeClass("txt-deletion")
                        }
                    },
                    un_hover_span(event) {
                        let category = event.target.dataset.category
                        if (category == 'paraphrase') {
                            let paraphrase_spans = $(`.paraphrase[data-id=${event.target.dataset.id}]`)
                            paraphrase_spans.removeClass("white")
                            paraphrase_spans.removeClass("bg-paraphrase")
                            let paraphrase_below_spans = $(`.paraphrase_below[data-id=${event.target.dataset.id}]`)
                            paraphrase_below_spans.removeClass("white")
                            paraphrase_below_spans.removeClass("bg-paraphrase")
                            paraphrase_below_spans.addClass("txt-paraphrase")
                        } else if (category == 'deletion') {
                            let deletion_spans = $(event.target)
                            deletion_spans.removeClass("white")
                            deletion_spans.removeClass("bg-deletion")
                            let deletion_below_spans = $(`.deletion_below[data-id=${event.target.dataset.id}]`)
                            deletion_below_spans.removeClass("white")
                            deletion_below_spans.removeClass("bg-deletion")
                            deletion_below_spans.addClass("txt-deletion")
                        }
                    },
                    select_original_html(event) {
                        if (!this.$parent.enable_select_original_sentence) {
                            return
                        }
                        this.$parent.process_original_html();
                        let selection = window.getSelection();
                        if (selection.anchorNode != selection.focusNode || selection.anchorNode == null) {
                            return;
                        }
                        let range = selection.getRangeAt(0);
                        let [start, end] = [range.startOffset, range.endOffset];
                        
                        if (start == end) {
                            return;
                        }
                        // manipulate start and end to try to respect word boundaries and remove
                        // whitespace.
                        end -= 1; // move to inclusive model for these computations.
                        let txt = this.$parent.hits_data[this.$parent.current_hit - 1].original
                        while (txt.charAt(start) == ' ') {
                            start += 1; // remove whitespace
                        }
                        while (start - 1 >= 0 && txt.charAt(start - 1) != ' ') {
                            start -= 1; // find word boundary
                        }
                        while (txt.charAt(end) == ' ') {
                            end -= 1; // remove whitespace
                        }
                        while (end + 1 <= txt.length - 1 && txt.charAt(end + 1) != ' ') {
                            end += 1; // find word boundary
                        }
                        // move end back to exclusive model
                        end += 1;
                        // stop if empty or invalid range after movement
                        if (start >= end) {
                            return;
                        }
                        this.$parent.selected_span_in_original = '\xa0' + txt.substring(start, end) + '\xa0'
                    },
                    deselect_original_html(event) {
                        if (!this.$parent.enable_select_original_sentence) {
                            return
                        }
                        document.getElementById("original-sentence").innerHTML = this.$parent.hits_data[this.$parent.current_hit - 1].original
                        this.$parent.original_html = this.$parent.hits_data[this.$parent.current_hit - 1].original
                    }
                }
            }
        },
        compiled_simplified_html() {
            return {
                template: `<div @mousedown='deselect_simplified_html' @mouseup='select_simplified_html' id="simplified-sentence" class="f4 lh-copy">${this.simplified_html}</div>`,
                methods: {
                    hover_span(event) {
                        let category = event.target.dataset.category
                        if (category == 'paraphrase') {
                            let paraphrase_spans = $(`.paraphrase[data-id=${event.target.dataset.id}]`)
                            paraphrase_spans.addClass("white")
                            paraphrase_spans.addClass("bg-paraphrase")
                            let paraphrase_below_spans = $(`.paraphrase_below[data-id=${event.target.dataset.id}]`)
                            paraphrase_below_spans.addClass("white")
                            paraphrase_below_spans.addClass("bg-paraphrase")
                            paraphrase_below_spans.removeClass("txt-paraphrase")
                        } else if (category == 'insertion') {
                            let insertion_spans = $(event.target)
                            insertion_spans.addClass("white")
                            insertion_spans.addClass("bg-insertion")
                        }
                    },
                    un_hover_span(event) {
                        let category = event.target.dataset.category
                        if (category == 'paraphrase') {
                            let paraphrase_spans = $(`.paraphrase[data-id=${event.target.dataset.id}]`)
                            paraphrase_spans.removeClass("white")
                            paraphrase_spans.removeClass("bg-paraphrase")
                            let paraphrase_below_spans = $(`.paraphrase_below[data-id=${event.target.dataset.id}]`)
                            paraphrase_below_spans.removeClass("white")
                            paraphrase_below_spans.removeClass("bg-paraphrase")
                            paraphrase_below_spans.addClass("txt-paraphrase")
                        } else if (category == 'insertion') {
                            let insertion_spans = $(event.target)
                            insertion_spans.removeClass("white")
                            insertion_spans.removeClass("bg-insertion")
                        }
                    },
                    select_simplified_html(event) {
                        if (!this.$parent.enable_select_simplified_sentence) {
                            return
                        }
                        this.$parent.process_simplified_html()
                        let selection = window.getSelection();
                        if (selection.anchorNode != selection.focusNode || selection.anchorNode == null) {
                            return;
                        }
                        let range = selection.getRangeAt(0);
                        let [start, end] = [range.startOffset, range.endOffset];
                        
                        if (start == end) {
                            return;
                        }
                        // manipulate start and end to try to respect word boundaries and remove
                        // whitespace.
                        end -= 1; // move to inclusive model for these computations.
                        let txt = this.$parent.hits_data[this.$parent.current_hit - 1].simplified
                        while (txt.charAt(start) == ' ') {
                            start += 1; // remove whitespace
                        }
                        while (start - 1 >= 0 && txt.charAt(start - 1) != ' ') {
                            start -= 1; // find word boundary
                        }
                        while (txt.charAt(end) == ' ') {
                            end -= 1; // remove whitespace
                        }
                        while (end + 1 <= txt.length - 1 && txt.charAt(end + 1) != ' ') {
                            end += 1; // find word boundary
                        }
                        // move end back to exclusive model
                        end += 1;
                        // stop if empty or invalid range after movement
                        if (start >= end) {
                            return;
                        }
                        console.log(start, end)
                        console.log(txt.substring(start, end))
                        this.$parent.selected_span_in_simplified = '\xa0' + txt.substring(start, end) + '\xa0'
                    },
                    deselect_simplified_html(event) {
                        if (!this.$parent.enable_select_simplified_sentence) {
                            return
                        }
                        document.getElementById("simplified-sentence").innerHTML = this.$parent.hits_data[this.$parent.current_hit - 1].simplified
                        this.$parent.simplified_html = this.$parent.hits_data[this.$parent.current_hit - 1].simplified
                    }
                }
            }
        },
        compiled_edits_html() {
            return {
                template: `<div class="f4 lh-copy">${this.edits_html}</div>`,
                methods: {
                    hover_span(event) {
                        console.log(this.$parent.hits_data)
                        // if the target is a span, go to the parent div
                        let target = event.target
                        if (target.tagName == 'SPAN') {
                            target = target.parentElement
                        }
                        let category = target.dataset.category
                        // console.log(event.target.dataset.id)
                        if (category == 'paraphrase') {
                            let paraphrase_spans = $(`.paraphrase[data-id=${target.dataset.id}]`)
                            paraphrase_spans.addClass("white")
                            paraphrase_spans.addClass("bg-paraphrase")
                            let paraphrase_below_spans = $(`.paraphrase_below[data-id=${target.dataset.id}]`)
                            paraphrase_below_spans.addClass("white")
                            paraphrase_below_spans.addClass("bg-paraphrase")
                            paraphrase_below_spans.removeClass("txt-paraphrase")
                        } else if (category == 'deletion') {
                            let deletion_spans = $(`.deletion[data-id=${target.dataset.id}]`)
                            deletion_spans.addClass("white")
                            deletion_spans.addClass("bg-deletion")
                            let deletion_below_spans = $(`.deletion_below[data-id=${target.dataset.id}]`)
                            deletion_below_spans.addClass("white")
                            deletion_below_spans.addClass("bg-deletion")
                            deletion_below_spans.removeClass("txt-deletion")
                        }
                    },
                    un_hover_span(event) {
                        // if the target is a span, go to the parent div
                        let target = event.target
                        if (target.tagName == 'SPAN') {
                            target = target.parentElement
                        }
                        let category = target.dataset.category
                        if (category == 'paraphrase') {
                            let paraphrase_spans = $(`.paraphrase[data-id=${target.dataset.id}]`)
                            paraphrase_spans.removeClass("white")
                            paraphrase_spans.removeClass("bg-paraphrase")
                            let paraphrase_below_spans = $(`.paraphrase_below[data-id=${target.dataset.id}]`)
                            paraphrase_below_spans.removeClass("white")
                            paraphrase_below_spans.removeClass("bg-paraphrase")
                            paraphrase_below_spans.addClass("txt-paraphrase")
                        } else if (category == 'deletion') {
                            let deletion_spans = $(`.deletion[data-id=${target.dataset.id}]`)
                            deletion_spans.removeClass("white")
                            deletion_spans.removeClass("bg-deletion")
                            let deletion_below_spans = $(`.deletion_below[data-id=${target.dataset.id}]`)
                            deletion_below_spans.removeClass("white")
                            deletion_below_spans.removeClass("bg-deletion")
                            deletion_below_spans.addClass("txt-deletion")
                        }
                    },
                    annotate_span(event) {
                        let x = event.pageX;
                        let y = event.pageY;
                        let target = event.target
                        if (target.tagName == 'SPAN') {
                            target = target.parentElement
                        }
                        let category = target.dataset.category
                        console.log(category)
                        $(`.quality-selection[data-category=${category}]`).css({
                            'display': "inline-block",
                            'left': x - 45,
                            'top': y + 5
                        }).fadeIn(200, function () {
                        });
                    }
                }
            }
        },
    },
})


app.mount('#app')
