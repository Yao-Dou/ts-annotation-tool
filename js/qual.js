const FormWizard = VueFormWizard.FormWizard;
const TabContent = VueFormWizard.TabContent;
const ExampleSent = Vue.component('example-sent', {
    template: `
    <div class="ex-sent">
      <p class="sent-desc">Original Sentence (Human Written):</p>
      <div class="sent">
          <p><slot name="complex-sent"></slot></p>
      </div>
      <p class="sent-desc">Simplified Sentence (Human or AI Model Written):</p>
      <div class="sent">
          <p class="mb1"><slot name="simple-sent"></slot></p>
      </div>
      <slot name="edit"></slot>
      <template v-if="this.explanation != undefined">
        <div class="explain">
          {{ explanation }}
        </div>
      </template>
    </div>
    `,
    props: ['explanation'],
});

const Sent = Vue.component('sent', {
  template: `<slot />`
});
const EditHeader = Vue.component('edit-header', {
  template: `
    <div class="f4 mt0 mb2 tc"> 
      <span class="edit-label">Edit:</span> 
      <template v-if="this.type == 'deletion'">
        <span class="edit-type txt-deletion f3">delete </span>
        <span class="pa1 edit-text br-pill-ns border-deletion-all deletion_below txt-deletion">&nbsp;<slot name="span"></slot>&nbsp;</span>
      </template>
      <template v-if="this.type == 'insertion'">
        <span class="edit-type txt-insertion f3">insert </span>
        <span class="pa1 edit-text br-pill-ns border-insertion-all insertion_below txt-insertion">&nbsp;<slot name="span"></slot>&nbsp;</span>
      </template>
      <template v-if="this.type == 'substitution'">
        <span class="edit-type txt-substitution f3">substitute </span>
        <span class="pa1 edit-text br-pill-ns border-substitution-all substitution_below txt-substitution">&nbsp;<slot name="span"></slot>&nbsp;</span>
        <span class="edit-type txt-substitution f3">with </span>
        <span class="pa1 edit-text br-pill-ns border-substitution-all substitution_below txt-substitution">&nbsp;<slot name="span2"></slot>&nbsp;</span>
      </template>
      <template v-if="this.type == 'split' && this.split_edit=='simple'">
        <span class="edit-type txt-split f3">split </span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;||&nbsp;</span>
      </template>
      <template v-if="this.type == 'split' && this.split_edit=='deletion'">
        <span class="edit-type txt-split f3">split </span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;||&nbsp;</span>
        <span class="edit-type txt-split f3">( delete </span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;<slot name="span"></slot>&nbsp;</span>
        <span class="edit-type txt-split f3">)</span>
      </template>
      <template v-if="this.type == 'split' && this.split_edit=='insertion'">
        <span class="edit-type txt-split f3">split </span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;||&nbsp;</span>
        <span class="edit-type txt-split f3">( insert </span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;<slot name="span"></slot>&nbsp;</span>
        <span class="edit-type txt-split f3">)</span>
      </template>
      <template v-if="this.type == 'split' && this.split_edit=='substitution'">
        <span class="edit-type txt-split f3">split </span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;||&nbsp;</span>
        <span class="edit-type txt-split f3">( substitute </span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;<slot name="span"></slot>&nbsp;</span>
        <span class="edit-type txt-split f3">with</span>
        <span class="pa1 edit-text br-pill-ns border-split-all split_below txt-split">&nbsp;<slot name="span2"></slot>&nbsp;</span>
        <span class="edit-type txt-split f3">)</span>
      </template>
    </div>
  `,
  props: ['type', 'split_edit'],
  created: function() {
    this.type = this.$props.type;
    this.split_edit = this.$props.split_edit;
  }
});
const AnswerBox = Vue.component('answer-box', {
  data (){
    return {
      isAnswer: false,
      type: ''
    }
  },
  template: `
    <template v-if="this.type == 'deletion'">
      <div class="column-severity w-25">
        <template v-if="interactive">
          <input class="checkbox-tools checkbox-tools-severity" type="radio" v-bind:id="editId*id" v-bind:name="editId">
        </template>
        <template v-else-if="isAnswer">
          <input class="checkbox-tools checkbox-tools-severity" type="radio" disabled checked>
        </template>
        <template v-else>
          <input class="checkbox-tools checkbox-tools-severity" type="radio" disabled>
        </template>
        <label class="for-checkbox-tools-severity question-deletion" v-bind:for="editId*id"> <slot></slot> </label>
      </div>
    </template>
    <template v-else-if="this.type == 'substitution'">
      <div class="column-severity w-25">
        <template v-if="interactive">
          <input class="checkbox-tools checkbox-tools-severity" type="radio" v-bind:id="editId*id" v-bind:name="editId">
        </template>
        <template v-else-if="isAnswer">
          <input class="checkbox-tools checkbox-tools-severity" type="radio" disabled checked>
        </template>
        <template v-else>
          <input class="checkbox-tools checkbox-tools-severity" type="radio" disabled>
        </template>
        <label class="for-checkbox-tools-severity question-substitution" v-bind:for="editId*id"> <slot></slot> </label>
      </div>
    </template>
    <template v-else-if="this.type == 'grammar'">
      <div>
        <template v-if="isAnswer"><input class="checkbox-tools-yes-no" type="radio" name="insertion-yes-no" id="insertion-yes" value="yes" checked></template>
        <template v-else><input class="checkbox-tools-yes-no" type="radio" name="insertion-yes-no" id="insertion-yes" value="yes" checked></template>
        <label class="normal for-checkbox-tools-yes-no question-deletion"><slot></slot></label>
      </div>
    </template>
    <template v-else-if="this.type == 'insertion'">
      <div class="column-severity w-33">
        <template v-if="isAnswer"><input class="checkbox-tools checkbox-tools-severity" type="radio" value="minor" disabled checked></template>
        <template v-else><input class="checkbox-tools checkbox-tools-severity" type="radio" value="minor" disabled></template>
        <label class="for-checkbox-tools-severity question-insertion" checked> <slot></slot> </label>
      </div>
    </template>
  `,
  props: ['isAnswer', 'type', 'interactive', 'id', 'editId', 'update'],
  created: function() {
    this.type = this.$props.type;
    this.isAnswer = this.$props.isAnswer;
    this.$props.interactive = this.$props.interactive ? this.$props.interactive=='true' ? true : false : false;

    if (this.$props.update) {
      this.$props.update(true);
    }
  }
});

const Edit = Vue.component('edit', {
  data (){
    return {
      answer: 0,
      question: '',
      explanation: '',
      subtypeQuestion: '',
      editId: 0,
      interactiveMessage: 'Please select an answer...'
    }
  },
  template: `
    <div>
      <div class="edit">
        <edit-header :type=type :split_edit=split_edit>
          <template #span>{{span}}</template>
          <template #span2>{{span2}}</template>
        </edit-header>

        <template v-if="this.subtype != '' && this.type == 'insertion'">
          <p class="mb2 b tracked-light">
            {{question}}
          </p>
          <div class="tc">
            <answer-box :isAnswer="this.subtype=='elaboration'" :type=type>Elaboration</answer-box>
            <answer-box :isAnswer="this.subtype=='hallucination'" :type=type>Hallucination</answer-box>
            <answer-box :isAnswer="this.subtype=='trivial'" :type=type>Trivial Insertion</answer-box>
          </div>
        </template>

        <template v-if="this.type == 'substitution'">
          <p class="mb2 b tracked-light">
            {{question}}
          </p>
          <div class="tc">
            <answer-box :isAnswer="this.subtype=='same'" :type=type>the same meaning</answer-box>
            <answer-box :isAnswer="this.subtype=='less'" :type=type>less information</answer-box>
            <answer-box :isAnswer="this.subtype=='more'" :type=type>more information</answer-box>
            <answer-box :isAnswer="this.subtype=='different'" :type=type>different meaning</answer-box>
          </div>
        </template>

        <template v-if="this.subtype == 'same' && this.simplify != undefined">
          <p class="mb2 b tracked-light">
            Does the new phrase simplify the original phrase? 
            </p>
            <div class="tc grammar-answer">
            <answer-box :isAnswer="this.simplify=='true'" :type=type>yes</answer-box>
            <answer-box :isAnswer="this.simplify=='false'" :type=type>no</answer-box>
          </div>
        </template>

        <template v-if="this.subtype == 'less' && this.answer > 0">
          <p class="mb2 b tracked-light">
            Is the deleted information significant to the main idea of the original sentence?
            </p>
            <div class="tc">
              <answer-box :isAnswer="this.answer==1" :type=type>1 - not at all</answer-box>
              <answer-box :isAnswer="this.answer==2" :type=type>2 - minor</answer-box>
              <answer-box :isAnswer="this.answer==3" :type=type>3 - somewhat</answer-box>
              <answer-box :isAnswer="this.answer==4" :type=type>4 - very much</answer-box>
            </div>
        </template>

        <template v-if="this.subtype == 'more' && this.subsubtype != undefined">
          <p class="mb2 b tracked-light">
            Select the type:
            </p>
            <div class="tc">
              <answer-box :isAnswer="this.subsubtype=='elaboration'" :type=type>elaboration</answer-box>
              <answer-box :isAnswer="this.subsubtype=='hallucination'" :type=type>hallucination</answer-box>
            </div>
        </template>

        <template v-if="this.subtype == 'more' && this.subsubtype == 'elaboration' && this.answer > 0">
          <p class="mb2 b tracked-light">
            How much the new information helps you to read and understand the sentence?
            </p>
            <div class="tc">
              <answer-box :isAnswer="this.answer==1" :type=type>1 - Minor</answer-box>
              <answer-box :isAnswer="this.answer==2" :type=type>2 - Somewhat</answer-box>
              <answer-box :isAnswer="this.answer==3" :type=type>3 - A lot</answer-box>
            </div>
        </template>

        <template v-if="this.subtype == 'different' && this.answer > 0">
          <p class="mb2 b tracked-light">
            How severe is this error?
            </p>
            <div class="tc">
              <answer-box :isAnswer="this.answer==1" :type=type>1 - Minor</answer-box>
              <answer-box :isAnswer="this.answer==2" :type=type>2 - Somewhat</answer-box>
              <answer-box :isAnswer="this.answer==3" :type=type>3 - A lot</answer-box>
            </div>
        </template>

        <template v-if="this.answer > 0 && this.subtype != 'less' && this.subtype != 'more' && this.subtype != 'different'">
          <p class="mb2 b tracked-light">
            {{question}}
          </p>
          <template v-if="this.type == 'deletion'">
            <div class="tc">
              <answer-box :isAnswer="this.answer==1" :type=type :interactive=interactive :id=1 :editId=editId :update=updateInteractiveMessage>1 - not at all</answer-box>
              <answer-box :isAnswer="this.answer==2" :type=type :interactive=interactive :id=2 :editId=editId :update=updateInteractiveMessage>2 - minor</answer-box>
              <answer-box :isAnswer="this.answer==3" :type=type :interactive=interactive :id=3 :editId=editId :update=updateInteractiveMessage>3 - somewhat</answer-box>
              <answer-box :isAnswer="this.answer==4" :type=type :interactive=interactive :id=4 :editId=editId :update=updateInteractiveMessage>4 - very much</answer-box>
            </div>
          </template>
          <template v-if="this.type == 'insertion'">
            <div class="tc">
              <answer-box :isAnswer="this.answer==1" :type=type>1 - Minor</answer-box>
              <answer-box :isAnswer="this.answer==2" :type=type>2 - Somewhat</answer-box>
              <answer-box :isAnswer="this.answer==3" :type=type>3 - A lot</answer-box>
            </div>
          </template>
        </template>

        <template v-if="this.grammar != ''">
          <p class="mb2 b tracked-light">
            Does this deletion edit introduce any fluency / grammar error?
          </p>
          <div class="tc grammar-answer">
            <answer-box :isAnswer="this.grammar=='true'" :type=type>yes</answer-box>
            <answer-box :isAnswer="this.grammar=='false'" :type=type>no</answer-box>
          </div>
        </template>
      </div>
      <template v-if="this.explanation != ''">
        <div class="explain">
          {{ explanation }}
        </div>
      </template>
      <template v-if="this.interactive == 'true'">
        {{ interactiveMessage }}
      </template>
    </div>
    `,
    props: ['type', 'subtype', 'subsubtype', 'span', 'span2', 'answer', 'explanation', 'grammar', 'simplify', 'interactive', 'incorrectMessage', 'correctMessage', 'split_edit'],
    methods: {          
      getQuestion: function() {
        switch (this.$props.type) {
          case 'deletion':
            return 'Is the deleted span significant to the main idea of the original sentence?';
          case 'insertion':
            return 'Is this insertion edit an elaboration, hallucination or adding trivial words?';
          case 'substitution':
            return 'Compared to the original phrase, the new phrase expresses:'
          default:
            return;
        }
      },
      getSubtypeQuestion: function() {
        switch (this.$props.subtype) {
          case 'elaboration':
            return 'How much it helps you to read and understand the sentence?';
          case 'hallucination':
            return 'How much it affects the main idea of the original sentence?';
          case "same":
            return 'Does the new phrase simplify the original phrase?';
          default:
            return this.$props.subtype;
        }
      },
      updateInteractiveMessage: function(isCorrect) {
        console.log(this.$props.correctMessage);
        this.interactiveMessage = isCorrect ? this.$props.correctMessage : this.$props.incorrectMessage;
      }
    },
    created: function() {
      this.question = this.getQuestion();
      this.subtypeQuestion = this.getSubtypeQuestion();
      this.answer = parseInt(this.$props.answer);
      this.explanation = this.$props.explanation ? this.$props.explanation : ``;
      this.$props.subtype = this.$props.subtype ? this.$props.subtype : ``;
      this.$props.grammar = this.$props.grammar ? this.$props.grammar : ``;
      this.$props.interactive = this.$props.interactive ? this.$props.interactive : ``;
      this.editId = Math.floor(Math.random() * 100);
    }
});

const Substitution = Vue.component('es', {
  template: `<span class="bg-substitution-light substitution"><slot /></span>`
});
const Insertion = Vue.component('ei', {
  template: `<span class="bg-insertion-light insertion"><slot /></span>`
});
const Deletion = Vue.component('ed', {
  template: `<span class="bg-deletion-light deletion"><slot /></span>`
});
const Split = Vue.component('esp', {
  template: `<span class="bg-split-light split"><slot /></span>`
});
const Todo = Vue.component('todo', {
  template: `<span class="todo"><slot /></span>`
});
const Quiz = Vue.component('quiz', {
  template: `
  <div>
    <img class="span_selection_quiz_answer" :id=id :src=imgsrc>
    <iframe :id=id :src=iframesrc width="100%" height="550" class="center db"></iframe>
    <div class="bb b--black-20 answer-container">
      <template v-if="this.answerExists == true">
        <a :id=id class="quiz-answer">See our answer →</a>
      </template>
    </div>
  </div>
  `,
  props: ['id', 'original', 'simplified'],
  created: function() {
    this.imgsrc = "./img/quiz-answers/" + this.$props.id + ".png"
    this.iframesrc = "quiz_instance.html?original=" + this.$props.original + "&simplified=" + this.$props.simplified
    this.answerExists = true;
    $.ajax({
      url:this.imgsrc,
      type:'HEAD',
      error:function(){
        console.log('could not find ' + this.$props.id); 
        this.answerExists = false
      }, 
    });
  },
  mounted: function() {
    let ourId = this.$props.id;
    $('a#' + ourId).hover( function() {
      $('img#' + ourId).css("display","inherit")
    }, function() {
      $('img#' + ourId).css("display","none")
    })
  }
});




new Vue({
  el: '#app',
  components: {
    'form-wizard': FormWizard,
    'tab-content': TabContent,
    'example-sent': ExampleSent,
    'sent': Sent,
    'edit': Edit,
    'edit-header': EditHeader,
    'answer-box': AnswerBox,
    'es': Substitution,
    'ei': Insertion,
    'ed': Deletion,
    'esp': Split,
    'todo': Todo,
    'quiz': Quiz
  },
  methods: {
    onComplete: function() {
      alert('Complete!');
    },
    onChange: function() {
      $('html, body').animate({ scrollTop: 0 }, 'fast');

      // Allow dynamic resizing of iframes
      let resizeObservers = [];
      $('iframe').each(function () {
          // Add an offset for extra space after the iframe
          constant = 40;
          try {
            let observer = new ResizeObserver(entries => 
              this.height = this.contentWindow.document.body.scrollHeight + constant
            )
            observer.observe(this.contentWindow.document.body)
            resizeObservers.push(observer)
          } catch (e) {
            console.log(e)
          }
      })
    }
  },
  mounted() {
    var wizard = this.$refs.wizard
    wizard.activateAll()
  }
})

// Deletion Example Script
var contents_in = $('#bt-sent').html()
var contents_out = $('#bt-sent-out').html()

function addSpan(n, length) {
  $('#bt-sent').html(
    contents_in.substring(0, n) + '<span class=bg-deletion-light>' + contents_in.substring(n, n+length) + '</span>' + contents_in.substring(n+length)
  )
  $('#bt-sent-out').html(
    contents_in.substring(0, n) + contents_in.substring(n+length)
  )
}
function removeSpan() {
  $('#bt-sent').html(contents_in)
  $('#bt-sent-out').html(contents_out)
}

addSpan(18, 11)

$('#bt-1').mouseover(
    function() { 
      addSpan(18, 11) 
    }
)
$('#bt-2').mouseover(
  function() { addSpan(29, 8) }
)
$('#bt-3').mouseover(
  function() { addSpan(0, 38) }
)
$('#bt-4').mouseover(
  function() { addSpan(70, 11) }
)
$('#bt-5').mouseover(
  function() { addSpan(82, 16) }
)
$('#bt-6').mouseover(
  function() { addSpan(0, 38) }
)
$('#bt-7').mouseover(
  function() { addSpan(105, 37) }
)

$(".deletion-examples").mouseover(
  function() {
    // current background to red
    $(this).css("background-color", "#F4B8B1");
    // other background to white
    $(this).siblings().css("background-color", "#fff");
  }
);

$("#get-annotation-btn").click(function() {
  var iframe = document.getElementById("test_iframe");
  // console.log(iframe)
  var elmnt = iframe.contentWindow.document.getElementById("hits-data");
  let data = elmnt.innerHTML;
  console.log(data);
  // download data as json file
  // console.log(elmnt.)
});