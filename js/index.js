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
            lines: {},
            insertion_deletion_lines: {},
            current_insertion_deletion_pair: null,
            open : false,
            open_annotation : false,
            category_to_id: {'deletion': 0, 'paraphrase': 1, 'split': 2, 'insertion': 3},
            id_to_category: {0: 'deletion', 1: 'paraphrase', 2: 'split', 3:'insertion'},

            current_insertion_edit_id : null,

            connect_delete_click : false,
            clicked_deletion: "",

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
                let light = "-light"
                let original_span_id = original_spans[i][3]
                if (("annotations" in this.hits_data[[this.current_hit - 1]]) && (original_span_id in this.hits_data[[this.current_hit - 1]].annotations[this.id_to_category[original_spans[i][0]]])) {
                    light = ""
                }
                if (original_spans[i][0] == 0) {
                    sentence_html += `<span @click="click_span" @mouseover="hover_span" @mouseout="un_hover_span" class="deletion border-deletion${light} pointer span original_span" data-category="deletion" data-id="deletion-` + original_span_id + `">`;
                } else if (original_spans[i][0] == 1) {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="paraphrase border-paraphrase${light} pointer span original_span" data-category="paraphrase" data-id="paraphrase-` + original_span_id + `">`;
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
            let category_id = this.category_to_id[category]
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
                        let light = "-light"
                        let original_span_id = original_spans[i][3]
                        if (("annotations" in this.hits_data[[this.current_hit - 1]]) && (original_span_id in this.hits_data[[this.current_hit - 1]].annotations[this.id_to_category[original_spans[i][0]]])) {
                            light = ""
                        }
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="deletion border-deletion${light} pointer span original_span" data-category="deletion" data-id="deletion-` + original_span_id + `">`;
                    }
                } else if (original_spans[i][0] == 1) {
                    if (original_spans[i][1] == start && original_spans[i][2] == end) {
                        sentence_html += `<span class="bg-paraphrase-light span">`;
                    } else {
                        let light = "-light"
                        let original_span_id = original_spans[i][3]
                        if (("annotations" in this.hits_data[[this.current_hit - 1]]) && (original_span_id in this.hits_data[[this.current_hit - 1]].annotations[this.id_to_category[original_spans[i][0]]])) {
                            light = ""
                        }
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="paraphrase border-paraphrase${light} pointer span original_span" data-category="paraphrase" data-id="paraphrase-` + original_span_id + `">`;
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
                let category = this.id_to_category[simplified_spans[i][0]]
                let light = "-light"
                let simplified_span_id = simplified_spans[i][3]
                if (("annotations" in this.hits_data[[this.current_hit - 1]]) && (simplified_span_id in this.hits_data[[this.current_hit - 1]].annotations[category])) {
                    light = ""
                }
                sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="${category} border-${category}${light} pointer span simplified_span" data-category="${category}" data-id="${category}-` + simplified_spans[i][3] + `">`;
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
                let category = this.id_to_category[simplified_spans[i][0]]
                if (simplified_spans[i][1] == start && simplified_spans[i][2] == end) {
                    sentence_html += `<span class="bg-${category}-light span">`;
                } else {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="${category} border-${category} pointer span simplified_span" data-category="${category}" data-id="${category}-` + simplified_spans[i][3] + `">`;
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

            let paraphrase_map = {}

            let spans_for_sort = [...original_spans]
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
                    spans_for_sort.push(simplified_spans[i]);
                } else if (simplified_spans[i][0] == 3) {
                    this.edits_dict['insertion'][simplified_spans[i][3]] = simplified_spans[i];
                    spans_for_sort.push(simplified_spans[i]);
                } else if (simplified_spans[i][0] == 1) {
                    this.edits_dict['paraphrase'][simplified_spans[i][3]].push(simplified_spans[i]);
                    paraphrase_map[simplified_spans[i][3]] = simplified_spans[i];
                }
            }

            spans_for_sort.sort(function(a, b) {
                return a[1] - b[1];
            });

            for (let span of spans_for_sort) {
                let i = span[3]
                let key_id = span[0];
                let key = this.id_to_category[key_id];
                let key_short = ""
                if (key == 'deletion') {
                    key_short = 'delete'
                } else if (key == 'paraphrase') {
                    key_short = 'paraphrase'
                } else if (key == 'insertion') {
                    key_short = 'insert'
                } else {
                    key_short = 'split'
                }
                let light = "-light"
                if (("annotations" in this.hits_data[[this.current_hit - 1]]) && (i in this.hits_data[[this.current_hit - 1]].annotations[key])) {
                    light = ""
                }
                new_html += `<div class='cf'>`
                new_html += `<div class="fl w-80 mb4 edit">`;
                new_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" data-id="${key}-${i}" data-category="${key}" class="default_cursor">`
                new_html += `<span class="edit-type txt-${key}${light} f3">${key_short} </span>`;
                new_html += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                if (key == 'deletion') {
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(span[1],span[2])}&nbsp`;
                } else if (key == "paraphrase") {
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(span[1], span[2])}&nbsp`;
                    new_html += `</span>`;
                    new_html += `<span class="edit-type txt-${key}${light} f3"> to </span>`;
                    new_html += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(paraphrase_map[i][1], paraphrase_map[i][2])}&nbsp`;
                } else {
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(span[1], span[2])}&nbsp`;
                }
                
                new_html += `</span>`;
                new_html += ` : `;
                // console.log(this.hits_data[this.current_hit - 1].annotations)
                if (!(i in this.hits_data[this.current_hit - 1].annotations[key])) {
                    new_html += `<span class="f4 i black-60">this edit is not annotated yet, click <i class="fa-solid fa-pencil"></i> to start!</span>`;
                } else {
                    let annotation = this.hits_data[this.current_hit - 1].annotations[key][i];
                    let annotation_text = ""
                    if (key == 'deletion') {
                        let how_much_significant = annotation[0]
                        if (how_much_significant == "perfect" || how_much_significant == "good") {
                            annotation_text = `<span class="light-orange ba bw1 pa1">${how_much_significant} deletion</span>`
                        } else {
                            annotation_text = `<span class="light-purple ba bw1 pa1">${how_much_significant} deletion</span>`;
                        }
                        if (annotation[1] == "yes") {
                            annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                        }
                        
                    } else if (key == 'paraphrase') {
                        let success_or_failure = annotation[0]
                        if (success_or_failure == "yes") {
                            annotation_text += `<span class="light-orange ba bw1 pa1">good paraphrase</span>`;
                            if (annotation[1] == "yes") {
                                annotation_text += ` <span class="light-purple ba bw1 pa1">simplifying</span>`;
                            } else {
                                annotation_text += ` <span class="light-purple ba bw1 pa1">not simplifying</span>`;
                            }
                        } else {
                            annotation_text += `<span class="light-purple ba bw1 pa1">bad paraphrase</span> `;
                            annotation_text += `<span class="light-purple ba bw1 pa1">${annotation[2]} error</span>`;
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
                new_html += `<i @click="annotate_edit" class="annotation-icon fa-solid fa-pencil mr3 pointer dim" data-id="${key}-${i}" data-category="${key}"></i>`;
                new_html += `<i @click="trash_edit" class="fa-solid fa-trash-can ml4 pointer dim" data-id="${key}-${i}" data-category="${key}"></i>`;
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
            if (this.connect_delete_click) {
                let insertion_id = this.current_insertion_deletion_pair[0]
                let deletion_id = this.current_insertion_deletion_pair[1]

                this.insertion_deletion_lines[insertion_id] = deletion_id
                
                console.log($(`.deletion.original_span[data-id='deletion-${deletion_id}']`)[0])
                let line = new LeaderLine(
                    $(`.insertion.simplified_span[data-id='insertion-${insertion_id}']`)[0],
                    $(`.deletion.original_span[data-id='deletion-${deletion_id}']`)[0],
                    {endPlug: "arrow3",
                    size: 3,
                    path: "straight",
                    color: "rgba(100,196,102, 0.4)",
                    hide: true}
                )
                line.show("draw")
            }
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
        insertion_corresponding_yes_click() {
            this.connect_delete_click = true;
            $('#connect-delete').slideDown(400);
        },
        insertion_corresponding_no_click() {
            this.connect_delete_click = false;
            $('#connect-delete').slideUp(400);
        },
        insertion_yes_click() {
            $('.bad').slideUp(400);
            $('.good').slideDown(400);
        },
        insertion_no_click() {
            $('.good').slideUp(400);
            $('.bad').slideDown(400);
        },
        refresh_edit(event) {
            this.connect_delete_click = false;
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
        fetch("https://raw.githubusercontent.com/Yao-Dou/ts-annotation-tool/main/data/human_references_58.json")
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
                    click_span(event) {
                        console.log(this.$parent.connect_delete_click);
                        if (this.$parent.connect_delete_click) {
                            console.log(event.target);
                            let text = event.target.innerText;
                            this.$parent.clicked_deletion = text;
                            let id = event.target.dataset.id
                            let real_id = id.split('-')[1]
                            this.$parent.current_insertion_deletion_pair = [this.$parent.current_insertion_edit_id, real_id]
                        }
                    },
                    hover_span(event) {
                        let category = event.target.dataset.category
                        let spans = $(`.${category}[data-id=${event.target.dataset.id}]`)
                        spans.addClass("white")
                        let below_spans= $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.addClass("white")
                        below_spans.removeClass(`txt-${category}`)
                        below_spans.removeClass(`txt-${category}-light`)

                        let id = event.target.dataset.id
                        let real_id = id.split("-")[1]

                        // check if bd-{category}-light is already in the class list
                        if (event.target.classList.contains(`border-${category}-light`)) {
                            spans.addClass(`bg-${category}-light`)
                            below_spans.addClass(`bg-${category}-light`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(173, 197, 250, 1.0)"
                            }
                        } else {
                            spans.addClass(`bg-${category}`)
                            below_spans.addClass(`bg-${category}`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(33, 134, 235, 1.0)"
                            }
                        }
                    },
                    un_hover_span(event) {
                        let category = event.target.dataset.category
                        let spans = $(`.${category}[data-id=${event.target.dataset.id}]`)
                        spans.removeClass("white")
                        let below_spans= $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.removeClass("white")

                        let id = event.target.dataset.id
                        let real_id = id.split("-")[1]

                        if (event.target.classList.contains(`border-${category}-light`)) {
                            below_spans.addClass(`txt-${category}-light`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(173, 197, 250, 0.4)"
                            }
                        } else {
                            below_spans.addClass(`txt-${category}`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(33, 134, 235, 0.46)"
                            }
                        }
                        spans.removeClass(`bg-${category}`)
                        spans.removeClass(`bg-${category}-light`)
                        below_spans.removeClass(`bg-${category}`)
                        below_spans.removeClass(`bg-${category}-light`)
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
                },
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
                        let below_spans= $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.addClass("white")
                        below_spans.removeClass(`txt-${category}`)
                        below_spans.removeClass(`txt-${category}-light`)

                        let id = event.target.dataset.id
                        let real_id = id.split("-")[1]

                        // check if bd-{category}-light is already in the class list
                        if (event.target.classList.contains(`border-${category}-light`)) {
                            spans.addClass(`bg-${category}-light`)
                            below_spans.addClass(`bg-${category}-light`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(173, 197, 250, 1.0)"
                            }
                        } else {
                            spans.addClass(`bg-${category}`)
                            below_spans.addClass(`bg-${category}`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(33, 134, 235, 1.0)"
                            }
                        }
                    },
                    un_hover_span(event) {
                        let category = event.target.dataset.category
                        let spans = $(`.${category}[data-id=${event.target.dataset.id}]`)
                        spans.removeClass("white")
                        let below_spans= $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.removeClass("white")

                        let id = event.target.dataset.id
                        let real_id = id.split("-")[1]

                        if (event.target.classList.contains(`border-${category}-light`)) {
                            below_spans.addClass(`txt-${category}-light`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(173, 197, 250, 0.4)"
                            }
                        } else {
                            below_spans.addClass(`txt-${category}`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(33, 134, 235, 0.46)"
                            }
                        }
                        spans.removeClass(`bg-${category}`)
                        spans.removeClass(`bg-${category}-light`)
                        below_spans.removeClass(`bg-${category}`)
                        below_spans.removeClass(`bg-${category}-light`)
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
                        if (target.tagName == 'SPAN' && target.parentElement.tagName != 'DIV') {
                            target = target.parentElement
                        } else if (target.tagName == 'I') {
                            target = target.parentElement.parentElement
                        }
                        let category = target.dataset.category
                        let spans = $(`.${category}[data-id=${target.dataset.id}]`)
                        spans.addClass("white")
                        let below_spans= $(`.${category}_below[data-id=${target.dataset.id}]`)
                        below_spans.addClass("white")
                        below_spans.removeClass(`txt-${category}`)
                        below_spans.removeClass(`txt-${category}-light`)

                        
                        let classList = below_spans.attr("class").split(/\s+/);

                        let real_id = target.dataset.id.split("-")[1]

                        // check if bd-{category}-light is already in the class list
                        if (classList.includes(`border-${category}-light-all`)) {
                            spans.addClass(`bg-${category}-light`)
                            below_spans.addClass(`bg-${category}-light`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(173, 197, 250, 1.0)"
                            }
                        } else {
                            spans.addClass(`bg-${category}`)
                            below_spans.addClass(`bg-${category}`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(33, 134, 235, 1.0)"
                            }
                        }
                    },
                    un_hover_span(event) {
                        // if the target is a span, go to the parent div
                        let target = event.target
                        if (target.tagName == 'SPAN' && target.parentElement.tagName != 'DIV') {
                            target = target.parentElement
                        } else if (target.tagName == 'I') {
                            target = target.parentElement.parentElement
                        }
                        let category = target.dataset.category
                        let spans = $(`.${category}[data-id=${target.dataset.id}]`)
                        spans.removeClass("white")
                        let below_spans= $(`.${category}_below[data-id=${target.dataset.id}]`)
                        below_spans.removeClass("white")

                        let classList = below_spans.attr("class").split(/\s+/);

                        let real_id = target.dataset.id.split("-")[1]

                        if (classList.includes(`border-${category}-light-all`)) {
                            below_spans.addClass(`txt-${category}-light`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(173, 197, 250, 0.4)"
                            }
                        } else {
                            below_spans.addClass(`txt-${category}`)
                            if (category == 'paraphrase') {
                                this.$parent.lines[real_id].color = "rgba(33, 134, 235, 0.46)"
                            }
                        }
                        spans.removeClass(`bg-${category}`)
                        spans.removeClass(`bg-${category}-light`)
                        below_spans.removeClass(`bg-${category}`)
                        below_spans.removeClass(`bg-${category}-light`)
                    },
                    annotate_edit(event) {
                        let target = event.target
                        let category = target.dataset.category

                        if(this.$parent.open){
                            $(`.quality-selection[data-category=${category}]`).slideUp(400);
                            $(event.target).removeClass(`txt-${category}`)
                        } else{
                            $(`.quality-selection`).slideUp(400)
                            $(`.quality-selection[data-category=${category}]`).slideDown(400);
                            $(event.target).addClass(`txt-${category}`)
                        }
                        this.$parent.open = !this.$parent.open;
                        
                        let id = target.dataset.id
                        
                        let edit_dict = this.$parent.edits_dict
                        let real_id = id.split("-")[1]

                        if (category == "insertion") {
                            this.$parent.current_insertion_edit_id = real_id
                        }

                        let spans = $(`.${category}[data-id=${id}]`)
                        spans.addClass("white")
                        spans.removeClass(`border-${category}-light`)
                        spans.addClass(`border-${category}`)
                        spans.addClass(`bg-${category}`)

                        // below_spans.addClass(`bg-${category}`)
                        
                        let original_sentence = this.$parent.hits_data[this.$parent.current_hit - 1].original
                        let simplified_sentence = this.$parent.hits_data[this.$parent.current_hit - 1].simplified
                        // parse the read_id to int
                        real_id = parseInt(real_id)

                        if (category == "paraphrase") {
                            let annotating_span_orginal = edit_dict[category][real_id][0]
                            let annotating_span_simplified = edit_dict[category][real_id][1]
                            this.$parent.annotating_edit_span_in_original = original_sentence.substring(annotating_span_orginal[1], annotating_span_orginal[2])
                            this.$parent.annotating_edit_span_in_simplified = simplified_sentence.substring(annotating_span_simplified[1], annotating_span_simplified[2])
                        } else {
                            let annotating_span = edit_dict[category][real_id]

                            if (annotating_span[0] == 0) {
                                this.$parent.annotating_edit_span_in_original = original_sentence.substring(annotating_span[1], annotating_span[2])
                            } else {
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
                },
                mounted: function () {
                    for (let i in this.$parent.lines) {
                        this.$parent.lines[i].remove()
                    }
                    this.$parent.lines = {}
                    let paraphrase_edits_dict = this.$parent.edits_dict["paraphrase"]
                    if ($('.paraphrase.original_span')[0] != null) {
                        for (let id in paraphrase_edits_dict) {
                            let color = "rgba(173, 197, 250, 0.4)"
                            if (("annotations" in this.$parent.hits_data[[this.$parent.current_hit - 1]]) && (id in this.$parent.hits_data[[this.$parent.current_hit - 1]].annotations["paraphrase"])) {
                                color = "rgba(33, 134, 235, 0.46)"
                            }
                            this.$parent.lines[id] = new LeaderLine(
                                $(`.paraphrase.original_span[data-id='paraphrase-${id}']`)[0],
                                $(`.paraphrase.simplified_span[data-id='paraphrase-${id}']`)[0],
                                {endPlug: "behind",
                                size: 3,
                                path: "straight",
                                color: color,}
                            )
                        }
                    }
                }
            }
        },
        total_edits () {
            if (this.hits_data == null) {
                return 0
            } else {
                // console.log(this.edits_dict)
                // iterate through the edits_dict and count the number of edits
                let total_num = 0
                for (let category in this.edits_dict) {
                    let category_dict = this.edits_dict[category]
                    for (let id in category_dict) {
                        total_num += 1
                    }
                }
                return total_num
            }
        },
        annotated_edits () {
            if (this.hits_data == null) {
                return 0
            } else {
                let total_num = 0
                for (let category in this.hits_data[[this.current_hit - 1]].annotations) {
                    let category_dict = this.hits_data[[this.current_hit - 1]].annotations[category]
                    for (let id in category_dict) {
                        total_num += 1
                    }
                }
                return total_num
            }
        },
    },
})


app.mount('#app')
