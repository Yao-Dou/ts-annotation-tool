const app = Vue.createApp({
    data() {
        return {
            total_hits: 0,
            current_hit: 3,
            hits_data: null,
            original_html: '',
            simplified_html: '',
            edits_html: '',
            edits_dict: { 'deletion': {}, 'substitution': {}, 'insertion': {}, 'split':{}},
            single_edit_html: '',
            enable_select_original_sentence: false,
            enable_select_simplified_sentence: false,
            selected_span_in_original: '',
            selected_span_in_simplified: '',
            selected_span_in_original_indexs: [],
            selected_span_in_simplified_indexs: [],
            selected_split: '',
            selected_split_id: null,

            // for deletion annotation box
            deletion_severity_box: "",
            deletion_grammar_yes_no_box: "",

            // for insertion annotation box
            insertion_type_box: "",
            insertion_elaboration_severity_box: "",
            insertion_hallucination_severity_box: "",
            insertion_trivial_yes_no_box: "",
            insertion_grammar_yes_no_box: "",

            // for substitution annotation box
            substitution_type_box: "",
            substitution_simplify_yes_no_box: "",
            substitution_less_severity_box: "",
            substitution_more_type_box: "",
            substitution_elaboration_severity_box: "",
            substitution_hallucination_severity_box: "",
            substitution_different_severity_box: "",
            substitution_grammar_yes_no_box: "",

            // for split annotation box
            split_simplify_yes_no_box: "",
            split_grammar_yes_no_box: "",
            

            lines: {"split":{}, "substitution":{}},
            current_insertion_deletion_pair: null,
            open : false,
            open_annotation : false,
            category_to_id: {'deletion': 0, 'substitution': 1, 'split': 2, 'insertion': 3},
            id_to_category: {0: 'deletion', 1: 'substitution', 2: 'split', 3:'insertion'},

            current_insertion_edit_id : null,

            // connect_delete_click : false,
            clicked_deletion: "",

            annotating_edit_span_in_original: '',
            annotating_edit_span_in_simplified: '',
            annotating_edit_span_for_split: '',
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
                let category = this.id_to_category[original_spans[i][0]]
                sentence_html += `<span @click="click_span" @mouseover="hover_span" @mouseout="un_hover_span" class="${category} border-${category}${light} pointer span original_span" data-category="${category}" data-id="${category}-` + original_span_id + `">`;
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
            // rank original_spans list by [1]
            original_spans.sort(function(a, b) {
                return a[1] - b[1];
            });
            // iterate original_spans list
            for (let i = 0; i < original_spans.length; i++) {
                sentence_html += original_sentence.substring(prev_idx, original_spans[i][1]);
                let span_category = this.id_to_category[original_spans[i][0]]
                if (original_spans[i][1] == start && original_spans[i][2] == end) {
                    sentence_html += `<span class="bg-${span_category}-light span">`;
                } else {
                    let light = "-light"
                    let original_span_id = original_spans[i][3]
                    if (("annotations" in this.hits_data[[this.current_hit - 1]]) && (original_span_id in this.hits_data[[this.current_hit - 1]].annotations[span_category])) {
                        light = ""
                    }
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="${span_category} border-${span_category}${light} pointer span original_span" data-category="${span_category}" data-id="${span_category}-` + original_span_id + `">`;
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
                if (category == "split" && (simplified_sentence.substring(simplified_spans[i][1], simplified_spans[i][2]) =="||")) {
                    sentence_html += `<span @mousedown.stop @mouseup.stop @click="click_span"  @mouseover="hover_span" @mouseout="un_hover_span" class="${category} pointer span simplified_span txt-split${light} split-sign" data-category="${category}" data-id="${category}-` + simplified_spans[i][3] + `">`;
                } else {
                    sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="${category} border-${category}${light} pointer span simplified_span" data-category="${category}" data-id="${category}-` + simplified_spans[i][3] + `">`;
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
            if (category == 'substitution') {
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
                    if (category == "split" && (simplified_sentence.substring(simplified_spans[i][1], simplified_spans[i][2]) =="||")) {
                        sentence_html += `<span @mousedown.stop @mouseup.stop @click="click_span"  @mouseover="hover_span" @mouseout="un_hover_span" class="${category} pointer span simplified_span txt-split split-sign" data-category="${category}" data-id="${category}-` + simplified_spans[i][3] + `">`;
                    } else {
                        sentence_html += `<span @mouseover="hover_span" @mouseout="un_hover_span" class="${category} border-${category} pointer span simplified_span" data-category="${category}" data-id="${category}-` + simplified_spans[i][3] + `">`;
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
            this.edits_dict = { 'deletion': {}, 'substitution': {}, 'insertion': {}, 'split':{}}
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            let simplified_spans = this.hits_data[this.current_hit - 1].simplified_spans
            // map for substituion that mapping to simplified span
            let substitution_map = {}

            let spans_for_sort = [...original_spans]
            // remove split span from spans_for_sort
            for (let i = 0; i < spans_for_sort.length; i++) {
                if (spans_for_sort[i][0] == 2) {
                    spans_for_sort.splice(i, 1);
                    i--;
                }
            }
            let new_html = ''
            for (let i = 0; i < original_spans.length; i++) {
                if (original_spans[i][0] == 0) {
                    this.edits_dict['deletion'][original_spans[i][3]] = original_spans[i];
                } else if (original_spans[i][0] == 1) {
                    this.edits_dict['substitution'][original_spans[i][3]] = [original_spans[i]];
                } else if (original_spans[i][0] == 2) {
                    this.edits_dict['split'][original_spans[i][3]] = {"split":null, "original": original_spans[i], "simplified": null};
                }
            }
            for (let i = 0; i < simplified_spans.length; i++) {
                if (simplified_spans[i][0] == 2) {
                    if (!(simplified_spans[i][3] in this.edits_dict['split'])) {
                        this.edits_dict['split'][simplified_spans[i][3]] = {"split":null, "original": null, "simplified": null};
                    }
                    if (this.hits_data[this.current_hit - 1].simplified.substring(simplified_spans[i][1], simplified_spans[i][2]) == "||") {
                        // push at the front
                        this.edits_dict['split'][simplified_spans[i][3]]["split"] = simplified_spans[i];
                        spans_for_sort.push(simplified_spans[i]);
                    } else {
                        this.edits_dict['split'][simplified_spans[i][3]]["simplified"] = simplified_spans[i];
                    }
                } else if (simplified_spans[i][0] == 3) {
                    this.edits_dict['insertion'][simplified_spans[i][3]] = simplified_spans[i];
                    spans_for_sort.push(simplified_spans[i]);
                } else if (simplified_spans[i][0] == 1) {
                    this.edits_dict['substitution'][simplified_spans[i][3]].push(simplified_spans[i]);
                    substitution_map[simplified_spans[i][3]] = simplified_spans[i];
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
                } else if (key == 'substitution') {
                    key_short = 'substitute'
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
                    new_html += `</span>`;
                } else if (key == "substitution") {
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(span[1], span[2])}&nbsp`;
                    new_html += `</span>`;
                    new_html += `<span class="edit-type txt-${key}${light} f3"> to </span>`;
                    new_html += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(substitution_map[i][1], substitution_map[i][2])}&nbsp`;
                    new_html += `</span>`;
                } else if (key == "split") {
                    // console.log(span)
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(span[1], span[2])}&nbsp</span>`;
                    if (this.edits_dict[key][i]["original"] != null && this.edits_dict[key][i]["simplified"] != null) {
                        new_html += `<span class="edit-type txt-${key}${light} f3"> (substitute </span>`;
                        new_html += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                        new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(this.edits_dict[key][i]["original"][1], this.edits_dict[key][i]["original"][2])}&nbsp`;
                        new_html += `</span>`;
                        new_html += `<span class="edit-type txt-${key}${light} f3"> with </span>`;
                        new_html += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                        new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(this.edits_dict[key][i]["simplified"][1], this.edits_dict[key][i]["simplified"][2])}&nbsp`;
                        new_html += `</span>`;
                        new_html += `<span class="edit-type txt-${key}${light} f3"> ) </span>`;
                    } else if (this.edits_dict[key][i]["original"] != null) {
                        new_html += `<span class="edit-type txt-${key}${light} f3"> (delete </span>`;
                        new_html += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                        new_html += `&nbsp${this.hits_data[this.current_hit - 1].original.substring(this.edits_dict[key][i]["original"][1], this.edits_dict[key][i]["original"][2])}&nbsp`;
                        new_html += `</span>`;
                        new_html += `<span class="edit-type txt-${key}${light} f3"> ) </span>`;
                    } else if (this.edits_dict[key][i]["simplified"] != null) {
                        new_html += `<span class="edit-type txt-${key}${light} f3"> (insert </span>`;
                        new_html += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${i}" data-category="${key}">`;
                        new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(this.edits_dict[key][i]["simplified"][1], this.edits_dict[key][i]["simplified"][2])}&nbsp`;
                        new_html += `</span>`;
                        new_html += `<span class="edit-type txt-${key}${light} f3"> ) </span>`;
                    }
                } else {
                    new_html += `&nbsp${this.hits_data[this.current_hit - 1].simplified.substring(span[1], span[2])}&nbsp</span>`;
                }
                
                new_html += ` : `;

                if (!(i in this.hits_data[this.current_hit - 1].annotations[key])) {
                    new_html += `<span class="f4 i black-60">this edit is not annotated yet, click <i class="fa-solid fa-pencil"></i> to start!</span>`;
                } else {
                    let annotation = this.hits_data[this.current_hit - 1].annotations[key][i];
                    let annotation_text = ""
                    if (key == 'deletion') {
                        if (annotation[0] == "perfect" ||  annotation[0] == "good") {
                            annotation_text = `<span class="light-orange ba bw1 pa1">${annotation[0]} deletion</span>`
                        } else {
                            annotation_text = `<span class="light-purple ba bw1 pa1">${annotation[0]} deletion</span>`;
                        }
                        if (annotation[1] == "yes") {
                            annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                        }
                    } else if (key == 'substitution') {
                        let type = annotation[0]
                        if (type == "same") {
                            if (annotation[1] == "yes") {
                                annotation_text += `<span class="light-orange ba bw1 pa1">good paraphrase</span>`;
                            } else {
                                annotation_text += `<span class="light-purple ba bw1 pa1">unnecessary paraphrase</span>`;
                            }
                            if (annotation[2] == "yes") {
                                annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                            }
                        } else if (type == "different") {
                            annotation_text += `<span class="light-purple ba bw1 pa1">bad substitution</span>`;
                            annotation_text += `<span class="light-pink ba bw1 pa1">${annotation[1]} severe</span>`;
                            if (annotation[2] == "yes") {
                                annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                            }
                        } else if (type == "less") {
                            if (annotation[1] == "perfect" ||  annotation[1] == "good") {
                                annotation_text = `<span class="light-orange ba bw1 pa1">${annotation[1]} substitution</span>`
                            } else {
                                annotation_text = `<span class="light-purple ba bw1 pa1">${annotation[1]} substitution</span>`;
                            }
                            if (annotation[2] == "yes") {
                                annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                            }
                        } else if (type == "more") {
                            if (annotation[1] == "elaboration") {
                                annotation_text += `<span class="light-orange ba bw1 pa1">include elaboration</span>`;
                                annotation_text += `<span class="light-pink ba bw1 pa1">simplify ${annotation[2]}</span>`;
                            } else {
                                annotation_text += `<span class="light-purple ba bw1 pa1">include hallucination</span>`;
                                annotation_text += `<span class="light-pink ba bw1 pa1">hallucinate ${annotation[2]}</span>`;
                            }
                            if (annotation[3] == "yes") {
                                annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                            }
                        }
                    } else if (key == 'insertion') {
                        if (annotation[0] == "elaboration") {
                            annotation_text += `<span class="light-orange ba bw1 pa1">elaboration</span>`;
                            annotation_text += `<span class="light-pink ba bw1 pa1">simplify ${annotation[1]}</span>`;
                        } else if (annotation[0] == "hallucination") {
                            annotation_text += `<span class="light-purple ba bw1 pa1">hallucination</span>`;
                            annotation_text += `<span class="light-pink ba bw1 pa1">hallucinate ${annotation[1]}</span>`;
                        } else {
                            if (annotation[1] == "yes") {
                                annotation_text += `<span class="light-orange ba bw1 pa1">good trivial insertion</span>`;
                            } else {
                                annotation_text += `<span class="light-purple ba bw1 pa1">bad trivial insertion</span>`;
                            }
                        }
                        if (annotation[2] == "yes") {
                            annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
                        }
                    } else if (key == 'split') {
                        if (annotation[0] == "yes") {
                            annotation_text = `<span class="light-orange ba bw1 pa1">good split</span>`
                        } else {
                            annotation_text = `<span class="light-purple ba bw1 pa1">unnecessary split</span>`;
                        }
                        if (annotation[1] == "yes") {
                            annotation_text += ` <span class="brown ba bw1 pa1 br-100">G</span>`;
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
            $(`.circle`).removeClass('circle-active');
            $(`#circle-${this.current_hit}`).addClass('circle-active');
            if ("bookmark" in this.hits_data[this.current_hit - 1] && this.hits_data[this.current_hit - 1]["bookmark"]) {
                $(`.bookmark`).addClass('bookmark-active');
            } else {
                $(`.bookmark`).removeClass('bookmark-active');
            }
            if ("comment" in this.hits_data[this.current_hit - 1]) {
                $(`#comment_area`).val(this.hits_data[this.current_hit - 1]["comment"]);
            } else {
                $(`#comment_area`).val("");
            }
        },
        go_to_hit(hit_num) {
            if (hit_num > this.total_hits) {
                hit_num = this.total_hits;
            } else if (hit_num < 1) {
                hit_num = 1;
            }
            this.current_hit = hit_num;
            this.process_everything();
        },
        go_to_hit_circle(hit_num, event) {
            if (hit_num > this.total_hits) {
                hit_num = this.total_hits;
            } else if (hit_num < 1) {
                hit_num = 1;
            }
            this.current_hit = hit_num;

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
        leave_comment(event) {
            // if #comment_area_div is not displayed, display it
            $("#comment_area_div").show();
        },
        record_comment(event) {
            // record the comment
            this.hits_data[this.current_hit - 1]["comment"] = event.target.value;
        },
        cancel_click() {
            $(".icon-default").removeClass("open")
            this.refresh_edit();
        },
        save_click() {
            $(".icon-default").removeClass("open")
            this.open = !this.open;
            let original_spans = this.hits_data[this.current_hit - 1].original_spans
            let simplified_spans = this.hits_data[this.current_hit - 1].simplified_spans
            let selected_category = $("input[name=edit_cotegory]:checked").val();
            let category_edits = this.edits_dict[selected_category]
            if (selected_category == "deletion") {
                let new_deletion = [0, this.selected_span_in_original_indexs[0], this.selected_span_in_original_indexs[1], Object.keys(category_edits).length]
                original_spans.push(new_deletion)
            } else if (selected_category == "substitution") {
                let new_substitution = [[1, this.selected_span_in_original_indexs[0], this.selected_span_in_original_indexs[1], Object.keys(category_edits).length], [1, this.selected_span_in_simplified_indexs[0], this.selected_span_in_simplified_indexs[1], Object.keys(category_edits).length]]
                original_spans.push(new_substitution[0])
                simplified_spans.push(new_substitution[1])
            } else if (selected_category == "split") {
                let new_split_simplified = [2, this.selected_span_in_simplified_indexs[0], this.selected_span_in_simplified_indexs[1], this.selected_split_id]
                let new_split_original = [2, this.selected_span_in_original_indexs[0], this.selected_span_in_original_indexs[1], this.selected_split_id]
                if (this.selected_span_in_original_indexs[0] != undefined) {
                    original_spans.push(new_split_original)
                }
                if (this.selected_span_in_simplified_indexs[0] != undefined) {
                    simplified_spans.push(new_split_simplified)
                }
            } else if (selected_category == "insertion") {
                let new_insertion = [3, this.selected_span_in_simplified_indexs[0], this.selected_span_in_simplified_indexs[1], Object.keys(category_edits).length]
                simplified_spans.push(new_insertion)
            }
            this.process_everything();
            this.refresh_edit();
        },
        save_anntotation_click(category, event) {
            let edit_id = this.annotating_edit_span_category_id
            
            let box = []
            if (category == "deletion") {
                box = [this.deletion_severity_box, this.deletion_grammar_yes_no_box]
            } else if (category == "substitution") {
                if (this.substitution_type_box == "same") {
                    box = [this.substitution_type_box, this.substitution_simplify_yes_no_box, this.substitution_grammar_yes_no_box]
                } else if (this.substitution_type_box == "different") {
                    box = [this.substitution_type_box, this.substitution_different_severity_box, this.substitution_grammar_yes_no_box]
                } else if (this.substitution_type_box == "less") {
                    box = [this.substitution_type_box, this.substitution_less_severity_box, this.substitution_grammar_yes_no_box]
                } else if (this.substitution_type_box == "more") {
                    if (this.substitution_more_type_box == "elaboration") {
                        box = [this.substitution_type_box, this.substitution_more_type_box, this.substitution_elaboration_severity_box, this.substitution_grammar_yes_no_box]
                    } else {
                        box = [this.substitution_type_box, this.substitution_more_type_box, this.substitution_hallucination_severity_box, this.substitution_grammar_yes_no_box]
                    }
                }
            } else if (category == "split") {
                box = [this.split_simplify_yes_no_box, this.split_grammar_yes_no_box]
            } else if (category == "insertion") {
                if (this.insertion_type_box == "elaboration") {
                    box = [this.insertion_type_box, this.insertion_elaboration_severity_box, this.insertion_grammar_yes_no_box]
                } else if (this.insertion_type_box == "hallucination") {
                    box = [this.insertion_type_box, this.insertion_hallucination_severity_box, this.insertion_grammar_yes_no_box]
                } else{
                    box = [this.insertion_type_box, this.insertion_trivial_yes_no_box, this.insertion_grammar_yes_no_box]
                }
            }
            console.log(box)
            this.hits_data[this.current_hit - 1].annotations[category][edit_id] = box
            this.process_everything();
            this.refresh_edit();
        },
        substitution_type_click(event) {
            // get the value of the clicked button
            let value = event.target.value;
            // if $(`.substitution-${value}`) is not visible, show it
            if (!($(`.substitution-${value}`).is(":visible"))) {
                $(`.substitution-type-div`).hide();
                $(`.substitution-${value}`).slideDown(400);
                if (value != "more") {
                    $(`.substitution-more-div`).hide();
                } else {
                    if ($(`input[name='substitution-more-type']:checked`).val() != undefined) {
                        $(`.substitution-more-${$(`input[name='substitution-more-type']:checked`).val()}`).slideDown(400);
                    }
                }
            }
        },
        substitution_more_click(event) {
            // get the value of the clicked button
            let value = event.target.value;
            // if $(`.substitution-${value}`) is not visible, show it
            if (!$(`.substitution-more-${value}`).is(":visible")) {
                $(`.substitution-more-div`).hide();
                $(`.substitution-more-${value}`).slideDown(400);
            }
        },
        substitution_show_grammar(event) {
            if (!$(`substitution-grammar-div`).is(":visible")) {
                $('.substitution-grammar-div').slideDown(400);
            }
        },
        insertion_type_click(event) {
            let value = event.target.value;
            // if $(`.substitution-${value}`) is not visible, show it
            if (!$(`.insertion-type-${value}`).is(":visible")) {
                $(`.insertion-type-div`).hide();
                $(`.insertion-type-${value}`).slideDown(400);
            }
        },
        insertion_show_grammar(event) {
            if (!$(`.insertion-grammar-div`).is(":visible")) {
                $('.insertion-grammar-div').slideDown(400);
            }
        },
        bookmark_this_hit() {
            if ("bookmark" in this.hits_data[this.current_hit - 1]) {
                this.hits_data[this.current_hit - 1].bookmark = !this.hits_data[this.current_hit - 1].bookmark
            } else {
                this.hits_data[this.current_hit - 1].bookmark = true
            }
            // if "bookmark-active" is in classlist of ".bookmark"
            if ($(".bookmark").hasClass("bookmark-active")) {
                // remove "bookmark-active" from classlist of ".bookmark"
                $(".bookmark").removeClass("bookmark-active");
                $(`#circle-${this.current_hit}`).removeClass('circle-bookmark');
            } else {
                $(".bookmark").addClass("bookmark-active")
                $(`#circle-${this.current_hit}`).addClass('circle-bookmark');
            }
        },
        refresh_edit() {
            this.open = false;
            this.selected_span_in_original = '',
            this.selected_span_in_simplified = '',
            this.selected_span_in_original_indexs = [],
            this.selected_span_in_simplified_indexs = [],
            this.enable_select_original_sentence = false;
            this.enable_select_simplified_sentence = false;
            $("input[name=edit_cotegory]").prop("checked", false);
            $(".checkbox-tools").prop("checked", false);
            $(".checkbox-tools-yes-no").prop("checked", false);
            $(".annotation-icon").removeClass('txt-substitution');
            $(".annotation-icon").removeClass('txt-insertion')
            $(".annotation-icon").removeClass('txt-deletion')
            $(".annotation-icon").removeClass('txt-split')
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
            }  else if (event.target.value == 'substitution' || event.target.value == 'split') {
                this.enable_select_original_sentence = true;
                this.enable_select_simplified_sentence = true;
            } else {
                this.enable_select_simplified_sentence = true;
                this.enable_select_original_sentence = false;
            }
        },
        async parseJsonFile(file) {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader()
                fileReader.onload = event => resolve(JSON.parse(event.target.result))
                fileReader.onerror = error => reject(error)
                fileReader.readAsText(file)
            })
        },
        async handle_file_upload(event) {
            let file = event.target.files[0];
            let new_json = await this.parseJsonFile(file)
            this.hits_data = new_json;
            this.current_hit = 1;
            for (let i = 0; i < this.hits_data.length; i++) {
                if (this.hits_data[i].annotations == undefined) {
                    this.hits_data[i].annotations = {
                        'deletion': [],
                        'substitution': [],
                        'insertion': [],
                        'split': []
                    }
                }
            }
            this.total_hits = new_json.length;
            this.process_everything();
        },
        handle_file_download() {
            var json = JSON.stringify(this.hits_data);
            var blob = new Blob([json], {type: "application/json"});
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = "annotations.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    },
    created: function () {
        fetch("https://raw.githubusercontent.com/Yao-Dou/ts-annotation-tool/main/data/human_references_58.json")
            .then(r => r.json())
            .then(json => {
                this.hits_data = json;
                for (let i = 0; i < this.hits_data.length; i++) {
                    if (this.hits_data[i].annotations == undefined) {
                        this.hits_data[i].annotations = {
                            'deletion': [],
                            'substitution': [],
                            'insertion': [],
                            'split': []
                        }
                    }
                }
                this.total_hits = json.length;
                this.process_everything();
            });
    },
    mounted: function () {
    },
    computed: {
        compiled_original_html() {
            return {
                template: `<div @mousedown='deselect_original_html' @mouseup='select_original_html' id="original-sentence" class="f4 lh-copy">${this.original_html}</div>`,
                methods: {
                    click_span(event) {
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
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(173, 197, 250, 1.0)"
                            }
                        } else {
                            spans.addClass(`bg-${category}`)
                            below_spans.addClass(`bg-${category}`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(33, 134, 235, 1.0)"
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
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(173, 197, 250, 0.4)"
                            }
                        } else {
                            below_spans.addClass(`txt-${category}`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(33, 134, 235, 0.46)"
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
                    click_span(event) {
                        let id = event.target.dataset.id
                        let real_id = id.split("-")[1]
                        let normal_id = parseInt(real_id) + 1
                        if (normal_id == 1) {
                            this.$parent.selected_split = `the 1st split`
                        } else if (normal_id == 2) {
                            this.$parent.selected_split = `the 2nd split`
                        } else if (normal_id == 3) {
                            this.$parent.selected_split = `the 3rd split`
                        } else {
                            this.$parent.selected_split = `the ${normal_id}th split`
                        }
                        this.$parent.selected_split_id = parseInt(real_id)
                    },
                    hover_span(event) {
                        let category = event.target.dataset.category
                        let spans = $(`.${category}[data-id=${event.target.dataset.id}]`)
                        spans.addClass("white")

                        let split_signs = $(`.split-sign[data-id=${event.target.dataset.id}]`)

                        let below_spans= $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.addClass("white")
                        below_spans.removeClass(`txt-${category}`)
                        below_spans.removeClass(`txt-${category}-light`)

                        let id = event.target.dataset.id
                        let real_id = id.split("-")[1]
                        if (event.target.classList.contains(`split-sign`)) {
                            if (event.target.classList.contains(`txt-${category}-light`)) {
                                spans.addClass(`bg-${category}-light`)
                                spans.addClass(`white`)
                                spans.removeClass(`txt-${category}-light`)
                                below_spans.addClass(`bg-${category}-light`)
                                return
                            } else {
                                spans.addClass(`bg-${category}`)
                                spans.addClass(`white`)
                                spans.removeClass(`txt-${category}`)
                                below_spans.addClass(`bg-${category}`)
                                return
                            }
                        }

                        // check if bd-{category}-light is already in the class list
                        if (event.target.classList.contains(`border-${category}-light`)) {
                            spans.addClass(`bg-${category}-light`)
                            if (category == 'split') {
                                split_signs.removeClass(`txt-${category}-light`)
                            }
                            below_spans.addClass(`bg-${category}-light`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(173, 197, 250, 1.0)"
                            }
                        } else {
                            spans.addClass(`bg-${category}`)
                            if (category == 'split') {
                                split_signs.removeClass(`txt-${category}`)
                            }
                            below_spans.addClass(`bg-${category}`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(33, 134, 235, 1.0)"
                            }
                        }
                    },
                    un_hover_span(event) {
                        let category = event.target.dataset.category
                        let spans = $(`.${category}[data-id=${event.target.dataset.id}]`)
                        spans.removeClass("white")

                        let split_signs = $(`.split-sign[data-id=${event.target.dataset.id}]`)

                        let below_spans= $(`.${category}_below[data-id=${event.target.dataset.id}]`)
                        below_spans.removeClass("white")

                        let id = event.target.dataset.id
                        let real_id = id.split("-")[1]

                        let below_spans_class_list = below_spans.attr('class').split(/\s+/)
                        if (event.target.classList.contains(`split-sign`)) {
                            if (below_spans_class_list.includes(`bg-${category}-light`)) {
                                spans.removeClass(`bg-${category}-light`)
                                spans.removeClass(`white`)
                                split_signs.addClass(`txt-${category}-light`)
                                below_spans.removeClass(`bg-${category}-light`)
                                below_spans.addClass(`txt-${category}-light`)
                                return
                            } else {
                                spans.removeClass(`bg-${category}`)
                                spans.removeClass(`white`)
                                split_signs.addClass(`txt-${category}`)
                                below_spans.removeClass(`bg-${category}`)
                                below_spans.addClass(`txt-${category}`)
                                return
                            }
                        }

                        if (event.target.classList.contains(`border-${category}-light`)) {
                            below_spans.addClass(`txt-${category}-light`)
                            if (category == 'split') {
                                split_signs.addClass(`txt-${category}-light`)
                            }
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(173, 197, 250, 0.4)"
                            }
                        } else {
                            below_spans.addClass(`txt-${category}`)
                            if (category == 'split') {
                                split_signs.addClass(`txt-${category}`)
                            }
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(33, 134, 235, 0.46)"
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
                            if (target.parentElement.parentElement.tagName != 'DIV') {
                                target = target.parentElement.parentElement
                            } else {
                                target = target.parentElement
                            }
                        } else if (target.tagName == 'I') {
                            target = target.parentElement.parentElement
                        }
                        let category = target.dataset.category
                        let spans = $(`.${category}[data-id=${target.dataset.id}]`)
                        spans.addClass("white")

                        let split_signs = $(`.split-sign[data-id=${target.dataset.id}]`)

                        let below_spans= $(`.${category}_below[data-id=${target.dataset.id}]`)
                        below_spans.addClass("white")
                        below_spans.removeClass(`txt-${category}`)
                        below_spans.removeClass(`txt-${category}-light`)

                        
                        let classList = below_spans.attr("class").split(/\s+/);

                        let real_id = target.dataset.id.split("-")[1]

                        // check if bd-{category}-light is already in the class list
                        if (classList.includes(`border-${category}-light-all`)) {
                            split_signs.removeClass(`txt-${category}-light`)
                            spans.addClass(`bg-${category}-light`)
                            below_spans.addClass(`bg-${category}-light`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(173, 197, 250, 1.0)"
                            }
                        } else {
                            split_signs.removeClass(`txt-${category}`)
                            spans.addClass(`bg-${category}`)
                            below_spans.addClass(`bg-${category}`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(33, 134, 235, 1.0)"
                            }
                        }
                    },
                    un_hover_span(event) {
                        // if the target is a span, go to the parent div
                        let target = event.target
                        if (target.tagName == 'SPAN' && target.parentElement.tagName != 'DIV') {
                            if (target.parentElement.parentElement.tagName != 'DIV') {
                                target = target.parentElement.parentElement
                            } else {
                                target = target.parentElement
                            }
                        } else if (target.tagName == 'I') {
                            target = target.parentElement.parentElement
                        }
                        let category = target.dataset.category
                        let spans = $(`.${category}[data-id=${target.dataset.id}]`)
                        spans.removeClass("white")

                        let split_signs = $(`.split-sign[data-id=${target.dataset.id}]`)

                        let below_spans= $(`.${category}_below[data-id=${target.dataset.id}]`)
                        below_spans.removeClass("white")

                        let classList = below_spans.attr("class").split(/\s+/);

                        let real_id = target.dataset.id.split("-")[1]

                        if (classList.includes(`border-${category}-light-all`)) {
                            split_signs.addClass(`txt-${category}-light`)
                            below_spans.addClass(`txt-${category}-light`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(173, 197, 250, 0.4)"
                            }
                        } else {
                            split_signs.addClass(`txt-${category}`)
                            below_spans.addClass(`txt-${category}`)
                            if (category == 'substitution') {
                                this.$parent.lines[category][real_id].color = "rgba(33, 134, 235, 0.46)"
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
                            this.$parent.refresh_edit();
                            return;
                        } else{
                            $(`.quality-selection`).slideUp(400)
                            $(`.quality-selection[data-category=${category}]`).slideDown(400);
                            $(event.target).addClass(`txt-${category}`)
                            this.$parent.open = !this.$parent.open;
                        }

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
                        // parse the real_id to int
                        real_id = parseInt(real_id)

                        if (category == "substitution") {
                            let annotating_span_orginal = edit_dict[category][real_id][0]
                            let annotating_span_simplified = edit_dict[category][real_id][1]
                            this.$parent.annotating_edit_span_in_original = original_sentence.substring(annotating_span_orginal[1], annotating_span_orginal[2])
                            this.$parent.annotating_edit_span_in_simplified = simplified_sentence.substring(annotating_span_simplified[1], annotating_span_simplified[2])
                        } else if (category == "split") {
                            this.$parent.annotating_edit_span_for_split = ""
                            let category_id_dict = edit_dict[category][real_id]
                            let key = category
                            let light = ""
                            if (edit_dict[category][real_id]["original"] != null && edit_dict[category][real_id]["simplified"] != null) {
                                this.$parent.annotating_edit_span_for_split += `<span class="edit-type txt-${key}${light} f3"> (substitute </span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${real_id}" data-category="${key}">`;
                                this.$parent.annotating_edit_span_for_split += `&nbsp${original_sentence.substring(category_id_dict["original"][1], category_id_dict["original"][2])}&nbsp`;
                                this.$parent.annotating_edit_span_for_split += `</span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="edit-type txt-${key}${light} f3"> with </span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${real_id}" data-category="${key}">`;
                                this.$parent.annotating_edit_span_for_split += `&nbsp${simplified_sentence.substring(category_id_dict["simplified"][1], category_id_dict["simplified"][2])}&nbsp`;
                                this.$parent.annotating_edit_span_for_split += `</span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="edit-type txt-${key}${light} f3"> ) </span>`;
                            } else if (edit_dict[category][real_id]["original"] != null) {
                                this.$parent.annotating_edit_span_for_split += `<span class="edit-type txt-${key}${light} f3"> (delete </span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${real_id}" data-category="${key}">`;
                                this.$parent.annotating_edit_span_for_split += `&nbsp${original_sentence.substring(category_id_dict["original"][1], category_id_dict["original"][2])}&nbsp`;
                                this.$parent.annotating_edit_span_for_split += `</span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="edit-type txt-${key}${light} f3"> ) </span>`;
                            } else if (edit_dict[category][real_id]["simplified"] != null) {
                                this.$parent.annotating_edit_span_for_split += `</span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="edit-type txt-${key}${light} f3"> (insert </span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="pa1 edit-text br-pill-ns txt-${key}${light} border-${key}${light}-all ${key}_below" data-id="${key}-${real_id}" data-category="${key}">`;
                                this.$parent.annotating_edit_span_for_split += `&nbsp${simplified_sentence.substring(category_id_dict["simplified"][1], category_id_dict["simplified"][2])}&nbsp`;
                                this.$parent.annotating_edit_span_for_split += `</span>`;
                                this.$parent.annotating_edit_span_for_split += `<span class="edit-type txt-${key}${light} f3"> ) </span>`;
                            }
                        } else {
                            let annotating_span = edit_dict[category][real_id]

                            if (annotating_span[0] == 0) {
                                this.$parent.annotating_edit_span_in_original = original_sentence.substring(annotating_span[1], annotating_span[2])
                            } else {
                                this.$parent.annotating_edit_span_in_simplified = simplified_sentence.substring(annotating_span[1], annotating_span[2])
                            }
                        }
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
                        // parse the real_id to int
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
                    $(`#circle-${this.$parent.current_hit}`).addClass('circle-active');
                    
                    for (let category in this.$parent.lines) {
                        for (let i in this.$parent.lines[category]) {
                            if (category == "substitution") {
                                this.$parent.lines[category][i].remove()
                            } else {
                                for (let j in this.$parent.lines[category][i]) {
                                    this.$parent.lines[category][i][j].remove()
                                }
                            }
                        }
                    }
                    this.$parent.lines = {"split":{}, "substitution":{}}
                    let substitution_edits_dict = this.$parent.edits_dict["substitution"]
                    if ($('.substitution.original_span')[0] != null) {
                        for (let id in substitution_edits_dict) {
                            let color = "rgba(173, 197, 250, 0.4)"
                            if (("annotations" in this.$parent.hits_data[[this.$parent.current_hit - 1]]) && (id in this.$parent.hits_data[[this.$parent.current_hit - 1]].annotations["substitution"])) {
                                color = "rgba(33, 134, 235, 0.46)"
                            }
                            this.$parent.lines["substitution"][id] = new LeaderLine(
                                $(`.substitution.original_span[data-id='substitution-${id}']`)[0],
                                $(`.substitution.simplified_span[data-id='substitution-${id}']`)[0],
                                {endPlug: "behind",
                                size: 3,
                                path: "straight",
                                color: color,}
                            )
                        }
                    }

                    let split_edits_dict = this.$parent.edits_dict["split"]
                    if (split_edits_dict != {}) {
                        for (let id in split_edits_dict) {
                            let color = "rgba(250, 229, 175, 0.4)"
                            // if (("annotations" in this.$parent.hits_data[[this.$parent.current_hit - 1]]) && (id in this.$parent.hits_data[[this.$parent.current_hit - 1]].annotations["substitution"])) {
                            //     color = "rgba(33, 134, 235, 0.46)"
                            // }
                            this.$parent.lines["split"][id] = []
                            if (split_edits_dict[id]["simplified"] != null) {
                                this.$parent.lines["split"][id].push(
                                    new LeaderLine(
                                    $(`.split.simplified_span:not(.split-sign)[data-id='split-${id}']`)[0],
                                    $(`.split.split-sign[data-id='split-${id}']`)[0],
                                    {endPlug: "arrow3",
                                    size: 3,
                                    path: "arc",
                                    color: color,})
                                )
                            }
                            if (split_edits_dict[id]["original"] != null && split_edits_dict[id]["simplified"] != null) {
                                this.$parent.lines["split"][id].push(
                                    new LeaderLine(
                                    $(`.split.original_span[data-id='split-${id}']`)[0],
                                    $(`.split.simplified_span:not(.split-sign)[data-id='split-${id}']`)[0],
                                    {endPlug: "behind",
                                    size: 3,
                                    path: "straight",
                                    color: color,})
                                )
                            }
                            if (split_edits_dict[id]["original"] != null && split_edits_dict[id]["simplified"] == null) {
                                this.$parent.lines["split"][id].push(
                                    new LeaderLine(
                                    $(`.split.original_span[data-id='split-${id}']`)[0],
                                    $(`.split.split-sign[data-id='split-${id}']`)[0],
                                    {endPlug: "arrow3",
                                    size: 3,
                                    path: "straight",
                                    color: color,})
                                )
                            }
                        }
                    }
                }
            }
        },
        compiled_split_annotating_span(){
            return {
                template: `${this.annotating_edit_span_for_split}`,
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
        save_validated_deletion () {
            return false
        },
        save_validated_insertion () {
            return false
        },
        save_validated_split () {
            return false
        },
        save_validated_substitution () {
            return false
        }
    },
})


app.mount('#app')
