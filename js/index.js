const app = Vue.createApp({
    data() {
        return {
            total_hits: 0,
            current_hit: 1,
            hits_data: null,
            original_html: '',
            simplified_html: '',
            edits_html: '',
            edits_dict: { 'deletion': {}, 'paraphrase': {}, 'insertion': {}, 'split':{}},
            single_edit_html: '',
            enable_select_original_sentence: false,
            enable_select_simplified_sentence: false,
            selected_span_in_original: '',
            selected_span_in_simplified: '',
            selected_span_in_original_indexs: [],
            selected_span_in_simplified_indexs: [],
            open : false,
            category_to_id: {'deletion': 0, 'paraphrase': 1, 'split': 2, 'insertion': 3},


            annotating_edit_span_in_original: '',
            annotating_edit_span_in_simplified: '',
            annotating_edit_span_category: '',
            annotating_edit_span_category_id: -1,
        }
    },
    methods: {
        process_original_html() {
            let prev_idx = 0
            let sentence_html = ''
            let original_sentence = this.hits_data[this.current_hit - 1].original
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            original_spans.sort(function(a, b) {
                return a[1] - b[1];
            });
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
        process_original_html_with_selected_span(category, start, end) {
            this.selected_span_in_original_indexs = [start, end]
            let prev_idx = 0
            let sentence_html = ''
            let original_sentence = this.hits_data[this.current_hit - 1].original
            let original_spans = JSON.parse(JSON.stringify(this.hits_data[this.current_hit - 1].original_spans))
            let category_id = -1;
            if (category == 'deletion') {
                category_id = 0;
            } else if (category == 'paraphrase') {
                category_id = 1;
            }
            original_spans.push([category_id, start, end]);
            console.log(original_spans)
            // rank original_spans list by [1]
            original_spans.sort(function(a, b) {
                return a[1] - b[1];
            });
            // iterate original_spans list
            for (let i = 0; i < original_spans.length; i++) {
                sentence_html += original_sentence.substring(prev_idx, original_spans[i][1]);
                if (original_spans[i][0] == 0) {
                    if (original_spans[i][1] == start && original_spans[i][2] == end) {
                        sentence_html += `<span class="bg-deletion-light span">`;
                    } else {
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="deletion border-deletion pointer span" data-category="deletion" data-id="deletion-` + original_spans[i][3] + `">`;
                    }
                } else if (original_spans[i][0] == 1) {
                    if (original_spans[i][1] == start && original_spans[i][2] == end) {
                        sentence_html += `<span class="bg-paraphrase-light span">`;
                    } else {
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="paraphrase border-paraphrase pointer span" data-category="paraphrase" data-id="paraphrase-` + original_spans[i][3] + `">`;
                    }
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
            simplified_spans.sort(function(a, b) {
                return a[1] - b[1];
            });
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
        process_simplified_html_with_selected_span(category, start, end) {
            this.selected_span_in_simplified_indexs = [start, end]
            let prev_idx = 0
            let sentence_html = ''
            let simplified_sentence = this.hits_data[this.current_hit - 1].simplified
            let simplified_spans = JSON.parse(JSON.stringify(this.hits_data[this.current_hit - 1].simplified_spans))
            let category_id = -1;
            if (category == 'paraphrase') {
                category_id = 1;
            } else if (category == 'split') {
                category_id = 2;
            } else if (category == 'insertion') {
                category_id = 3;
            }
            simplified_spans.push([category_id, start, end]);
            // rank simplified_spans list by [1]
            simplified_spans.sort(function(a, b) {
                return a[1] - b[1];
            });
            // iterate simplified_spans list
            for (let i = 0; i < simplified_spans.length; i++) {
                sentence_html += simplified_sentence.substring(prev_idx, simplified_spans[i][1]);
                if (simplified_spans[i][0] == 1) {
                    if (simplified_spans[i][1] == start && simplified_spans[i][2] == end) {
                        sentence_html += `<span class="bg-paraphrase-light span">`;
                    } else {
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="paraphrase border-paraphrase pointer span" data-category="paraphrase" data-id="paraphrase-` + simplified_spans[i][3] + `">`;
                    }
                } else if (simplified_spans[i][0] == 2) {
                    if (simplified_spans[i][1] == start && simplified_spans[i][2] == end) {
                        sentence_html += `<span class="bg-split-light span">`;
                    } else {
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="split border-split pointer span" data-category="split" data-id="split-` + simplified_spans[i][3] + `">`;
                    }
                } else if (simplified_spans[i][0] == 3) {
                    if (simplified_spans[i][1] == start && simplified_spans[i][2] == end) {
                        sentence_html += `<span class="bg-insertion-light span">`;
                    } else {
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="insertion border-insertion pointer span" data-category="insertion" data-id="insertion-` + simplified_spans[i][3] + `">`;
                    }
                }
                sentence_html += simplified_sentence.substring(simplified_spans[i][1], simplified_spans[i][2]);
                sentence_html += `</span>`;
                prev_idx = simplified_spans[i][2];
            }
            sentence_html += simplified_sentence.substring(prev_idx);
            this.simplified_html = sentence_html;
        },
        process_edits_html() {
            this.edits_dict = { 'deletion': {}, 'paraphrase': {}, 'insertion': {}, 'split':{}}
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            let simplified_spans = this.hits_data[this.current_hit - 1].simplified_spans
            if (!("annotations" in this.hits_data[this.current_hit - 1])) {
                this.hits_data[this.current_hit - 1]["annotations"] = {'deletion': {}, 'paraphrase': {}, 'insertion': {}, 'split':{}}
            }
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
                    this.edits_dict['split'][simplified_spans[i][3]] = simplified_spans[i];
                } else if (simplified_spans[i][0] == 3) {
                    this.edits_dict['insertion'][simplified_spans[i][3]] = simplified_spans[i];
                } else if (simplified_spans[i][0] == 1) {
                    this.edits_dict['paraphrase'][simplified_spans[i][3]].push(simplified_spans[i]);
                }
            }
            for (let key in this.edits_dict) {
                if (key == 'paraphrase') {
                    continue;
                }
                let key_short = ""
                if (key == 'deletion') {
                    key_short = 'delete'
                } else if (key == 'insertion') {
                    key_short = 'insert'
                } else {
                    key_short = 'split'
                }
                for (let i in this.edits_dict[key]) {
                    new_html += `<div class='cf'>`
                    new_html += `<div class="fl w-80 mb4 edit">`;
                    new_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" data-id="${key}-${i}" data-category="${key}">`
                    new_html += `<span class="edit-type txt-${key} f3">${key_short} </span>`;
                    new_html += `<span class="pa1 edit-text br-pill-ns txt-${key} border-${key}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                    if (key == 'deletion') {
                        new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(this.edits_dict[key][i][1], this.edits_dict[key][i][2])}&nbsp`;
                    } else {
                        new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(this.edits_dict[key][i][1], this.edits_dict[key][i][2])}&nbsp`;
                    }
                    
                    new_html += `</span>`;
                    new_html += ` : `;
                    // console.log(this.hits_data[this.current_hit - 1].annotations)
                    if (!(i in this.hits_data[this.current_hit - 1].annotations[key])) {
                        new_html += `<span class="f4 i">this edit is not annotated yet, click <i class="fa-solid fa-pencil"></i> to start!</span>`;
                    } else {
                        let annotation = this.hits_data[this.current_hit - 1].annotations[key][i];
                        let annotation_text = ""
                        if (key == 'deletion') {
                            annotation_text = annotation[0]
                            if (annotation[1] == "no") {
                                annotation_text += " ,no frequency error";
                            } else {
                                annotation_text += " ,introduce frequency error";
                            }
                            
                        } else if (key == 'insertion') {
                            if (annotation[0] == "add example" || annotation[0] == "elaboration") {
                                annotation_text += "good insertion";
                                if (annotation[1] == "yes") {
                                    annotation_text += ", and simplify the sentence";
                                } else {
                                    annotation_text += ", but doesn't simplify the sentence";
                                }
                            } else {
                                annotation_text += "bad insertion,";
                                annotation_text += "with " + annotation[0] + " error";
                            }
                        } else if (key == 'split') {
                            console.log(annotation)
                            if (annotation[0] == "yes") {
                                annotation_text += "introduce grammar / influency error, ";
                            }
                            if (annotation[1] == "yes") {
                                annotation_text += "simplify the sentence";
                            } else {
                                annotation_text += "doesn't simplify the sentence";
                            }
                        }
                        new_html += `<span class="f4 i">${annotation_text}</span>`;
                    }
                    new_html += '</span>'
                    new_html += `</div>`;
                    new_html += `<div class="fl w-20 mb4 operation tc">`;
                    new_html += `<i @click="annotate_edit" class="fa-solid fa-pencil mr3 pointer dim" data-id="${key}-${i}" data-category="${key}"></i>`;
                    new_html += `<i @click="trash_edit" class="fa-solid fa-trash-can ml4 pointer dim" data-id="${key}-${i}" data-category="${key}"></i>`;
                    new_html += `</div>`;
                    new_html += `</div>`;
                }
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
                if (!(paraphrase_id in this.hits_data[this.current_hit - 1].annotations["paraphrase"])) {
                    new_html += `<span class="f4 i">this edit is not annotated yet, click <i class="fa-solid fa-pencil"></i> to start!</span>`;
                } else {
                    let annotation = this.hits_data[this.current_hit - 1].annotations["paraphrase"][paraphrase_id];
                    let annotation_text = "";
                    let success_or_failure = annotation[0]
                    if (success_or_failure == "yes") {
                        annotation_text += "good paraphrase";
                        if (annotation[1] == "yes") {
                            annotation_text += ", and simplify the sentence";
                        } else {
                            annotation_text += ", but doesn't simplify the sentence";
                        }
                    } else {
                        annotation_text += "bad paraphrase, ";
                        annotation_text += "with " + annotation[2] + " error";
                    }
                    new_html += `<span class="f4 i">${annotation_text}</span>`;
                }
                new_html += '</span>'
                new_html += `</div>`;
                new_html += `<div class="fl w-20 mb4 operation tc">`;
                new_html += `<i @click="annotate_edit" class="fa-solid fa-pencil mr3 pointer dim" data-id="paraphrase-${paraphrase_id}" data-category="paraphrase"></i>`;
                new_html += `<i @click="trash_edit" class="fa-solid fa-trash-can ml4 pointer dim" data-id="paraphrase-${paraphrase_id}" data-category="paraphrase"></i>`;
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
        add_an_edit(event) {
            if(this.open){
                $('#add_an_edit').slideUp(400);
                $(".icon-default").removeClass("open")
            } else{
                $('#add_an_edit').slideDown(400);
                $(".icon-default").addClass("open")
            }
            this.open = !this.open;
        },
        cancel_click() {
            $(".icon-default").removeClass("open")
            this.open = !this.open;
            this.refresh_edit();
        },
        save_click() {
            $(".icon-default").removeClass("open")
            this.open = !this.open;
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            let simplified_spans = this.hits_data[this.current_hit - 1].simplified_spans
            let selected_category = $("input[name=edit_cotegory]:checked").val();
            if (selected_category == "deletion") {
                let category_edits = this.edits_dict[selected_category]
                let new_deletion = [0, this.selected_span_in_original_indexs[0], this.selected_span_in_original_indexs[1], Object.keys(category_edits).length]
                original_spans.push(new_deletion)
            } else if (selected_category == "paraphrase") {
                let category_edits = this.edits_dict[selected_category]
                let new_paraphrase = [[1, this.selected_span_in_original_indexs[0], this.selected_span_in_original_indexs[1], Object.keys(category_edits).length], [1, this.selected_span_in_simplified_indexs[0], this.selected_span_in_simplified_indexs[1], Object.keys(category_edits).length]]
                original_spans.push(new_paraphrase[0])
                simplified_spans.push(new_paraphrase[1])
            } else if (selected_category == "split") {
                let category_edits = this.edits_dict[selected_category]
                let new_split = [2, this.selected_span_in_simplified_indexs[0], this.selected_span_in_simplified_indexs[1], Object.keys(category_edits).length]
                simplified_spans.push(new_split)
            } else if (selected_category == "insertion") {
                let category_edits = this.edits_dict[selected_category]
                let new_insertion = [3, this.selected_span_in_simplified_indexs[0], this.selected_span_in_simplified_indexs[1], Object.keys(category_edits).length]
                simplified_spans.push(new_insertion)
            }
            this.process_everything();
            this.refresh_edit();
        },
        save_deletion_anntotation_click() {
            let edit_id = this.annotating_edit_span_category_id
            let edit_category = this.annotating_edit_span_category

            let annotation_category = $("input[name=severity]:checked").val();
            let yes_or_no = $("input[name=deletion-yes-no]:checked").val();

            this.hits_data[this.current_hit - 1].annotations[edit_category][edit_id] = [annotation_category, yes_or_no]
            this.process_everything();
            this.refresh_edit();
        },
        save_paraphrase_anntotation_click() {
            let edit_id = this.annotating_edit_span_category_id
            let edit_category = this.annotating_edit_span_category

            let success_or_failure = $("input[name=paraphrase-yes-no]:checked").val();
            let simplify_yes_or_no = $("input[name=paraphrase-simplify-yes-no]:checked").val();
            let error_type = $("input[name=paraphrase-error]:checked").val();

            this.hits_data[this.current_hit - 1].annotations[edit_category][edit_id] = [success_or_failure, simplify_yes_or_no, error_type]
            this.process_everything();
            this.refresh_edit();
        },
        save_split_anntotation_click() {
            let edit_id = this.annotating_edit_span_category_id
            let edit_category = this.annotating_edit_span_category

            let grammar_yes_or_no = $("input[name=split-yes-no]:checked").val();
            let simplify_yes_or_no = $("input[name=split-simplify-yes-no]:checked").val();

            this.hits_data[this.current_hit - 1].annotations[edit_category][edit_id] = [grammar_yes_or_no, simplify_yes_or_no]
            this.process_everything();
            this.refresh_edit();
        },
        save_insertion_anntotation_click() {
            let edit_id = this.annotating_edit_span_category_id
            let edit_category = this.annotating_edit_span_category

            let insertion_type = $("input[name=insertion-type]:checked").val();
            let simplify_yes_or_no = $("input[name=insertion-simplify-yes-no]:checked").val();

            this.hits_data[this.current_hit - 1].annotations[edit_category][edit_id] = [insertion_type, simplify_yes_or_no]
            this.process_everything();
            this.refresh_edit();
        },
        paraphrase_yes_click() {
            $('.bad').slideUp(400);
            $('.good').slideDown(400);
        },
        paraphrase_no_click() {
            $('.good').slideUp(400);
            $('.bad').slideDown(400);
        },
        insertion_yes_click() {
            $('.good').slideDown(400);
        },
        insertion_no_click() {
            $('.good').slideUp(400);
        },
        refresh_edit(event) {
            this.selected_span_in_original = '',
            this.selected_span_in_simplified = '',
            this.selected_span_in_original_indexs = [],
            this.selected_span_in_simplified_indexs = [],
            this.enable_select_original_sentence = false;
            this.enable_select_simplified_sentence = false;
            $("input[name=edit_cotegory]").prop("checked", false);
            $('.quality-selection').slideUp(400);
            $(".span-selection-div").hide();
        },
        show_span_selection(event) {
            // this.process_original_html();
            // this.process_simplified_html();
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
                        let selected_category = $("input[name=edit_cotegory]:checked").val();
                        this.$parent.process_original_html_with_selected_span(selected_category, start, end);
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
                        let spans = $(`.${category}[data-id=${event.target.dataset.id}]`)
                        spans.addClass("white")
                        spans.addClass(`bg-${category}`)
                        let below_spans = $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.addClass("white")
                        below_spans.addClass(`bg-${category}`)
                        below_spans.removeClass(`txt-${category}`)
                    },
                    un_hover_span(event) {
                        let category = event.target.dataset.category
                        let spans = $(`.${category}[data-id=${event.target.dataset.id}]`)
                        spans.removeClass("white")
                        spans.removeClass(`bg-${category}`)
                        let below_spans = $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.removeClass("white")
                        below_spans.removeClass(`bg-${category}`)
                        below_spans.addClass(`txt-${category}`)
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
                        this.$parent.selected_span_in_simplified = '\xa0' + txt.substring(start, end) + '\xa0'
                        let selected_category = $("input[name=edit_cotegory]:checked").val();
                        this.$parent.process_simplified_html_with_selected_span(selected_category, start, end);
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
                        // console.log(this.$parent.hits_data)
                        // if the target is a span, go to the parent div
                        let target = event.target
                        if (target.tagName == 'SPAN') {
                            target = target.parentElement
                        }
                        let category = target.dataset.category
                        // console.log(event.target.dataset.id)
                        let spans = $(`.${category}[data-id=${target.dataset.id}]`)
                        spans.addClass("white")
                        spans.addClass(`bg-${category}`)
                        let below_spans = $(`.${category}_below[data-id=${target.dataset.id}]`)
                        below_spans.addClass("white")
                        below_spans.addClass(`bg-${category}`)
                        below_spans.removeClass(`txt-${category}`)
                    },
                    un_hover_span(event) {
                        // if the target is a span, go to the parent div
                        let target = event.target
                        if (target.tagName == 'SPAN') {
                            target = target.parentElement
                        }
                        let category = target.dataset.category
                        let spans = $(`.${category}[data-id=${target.dataset.id}]`)
                        spans.removeClass("white")
                        spans.removeClass(`bg-${category}`)
                        let below_spans = $(`.${category}_below[data-id=${target.dataset.id}]`)
                        below_spans.removeClass("white")
                        below_spans.removeClass(`bg-${category}`)
                        below_spans.addClass(`txt-${category}`)
                    },
                    annotate_edit(event) {
                        let target = event.target
                        let category = target.dataset.category
                        $(`.quality-selection`).slideUp(400)
                        $(`.quality-selection[data-category=${category}]`).slideDown(400);
                        let id = target.dataset.id
                        let edit_dict = this.$parent.edits_dict
                        let real_id = id.split("-")[1]
                        let original_sentence = this.$parent.hits_data[this.$parent.current_hit - 1].original
                        let simplified_sentence = this.$parent.hits_data[this.$parent.current_hit - 1].simplified
                        // parse the read_id to int
                        real_id = parseInt(real_id)
                        if (category == "paraphrase") {
                            let annotating_span_orginal = edit_dict[category][real_id][0]
                            let annotating_span_simplified = edit_dict[category][real_id][1]
                            console.log(annotating_span_orginal)
                            console.log(annotating_span_simplified)
                            this.$parent.annotating_edit_span_in_original = original_sentence.substring(annotating_span_orginal[1], annotating_span_orginal[2])
                            this.$parent.annotating_edit_span_in_simplified = simplified_sentence.substring(annotating_span_simplified[1], annotating_span_simplified[2])
                        } else {
                            let annotating_span = edit_dict[category][real_id]
                            console.log(annotating_span)
                            if (real_id in [0]) {
                                this.$parent.annotating_edit_span_in_original = original_sentence.substring(annotating_span[1], annotating_span[2])
                            }
                            if (real_id in [2, 3]) {
                                this.$parent.annotating_edit_span_in_simplified = simplified_sentence.substring(annotating_span[1], annotating_span[2])
                            }
                        }
                        this.$parent.annotating_edit_span_category = category
                        this.$parent.annotating_edit_span_category_id = real_id
                    },
                    trash_edit(event) {
                        let target = event.target
                        let category = target.dataset.category
                        let id = target.dataset.id
                        let original_spans = this.$parent.hits_data[this.$parent.current_hit - 1].original_spans
                        let simplified_spans = this.$parent.hits_data[this.$parent.current_hit - 1].simplified_spans
                        let category_id = this.$parent.category_to_id[category]
                        //  real_id is the numebr after "-" in id
                        let real_id = id.split("-")[1]
                        // parse the read_id to int
                        real_id = parseInt(real_id)

                        let newspans = []
                        for (let i = 0; i < original_spans.length; i++) {
                            if (original_spans[i][0] == category_id && original_spans[i][3] == real_id) {
                                continue
                            }
                            newspans.push(original_spans[i])
                        }

                        let newspans_simplified = []
                        for (let i = 0; i < simplified_spans.length; i++) {
                            if (simplified_spans[i][0] == category_id && simplified_spans[i][3] == real_id) {
                                continue
                            }
                            newspans_simplified.push(simplified_spans[i])
                        }
                        
                        this.$parent.hits_data[this.$parent.current_hit - 1].original_spans = newspans
                        this.$parent.hits_data[this.$parent.current_hit - 1].simplified_spans = newspans_simplified
                        delete this.$parent.hits_data[this.$parent.current_hit - 1]["annotations"][category][real_id]
                        this.$parent.process_everything();
                    }
                }
            }
        },
        total_edits () {
            // if (this.hits_data == null) {
            //     return 0
            // } else {
            //     console.log(this.edits_dict)
            //     let total_num
            // }
            return 3
        },
        annotated_edits () {
            return 0
        },
    },
})


app.mount('#app')
