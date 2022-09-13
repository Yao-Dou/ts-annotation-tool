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
          <p><slot name="simple-sent"></slot></p>
      </div>
      <slot name="edit"></slot>
      <div class="explain">
          {{ explanation }}
      </div>
    </div>
    `,
    props: ['explanation']
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
        <span class="pa1 edit-text br-pill-ns border-deletion-all deletion_below txt-deletion">&nbsp;<slot></slot>&nbsp;</span>
      </template>
      <template v-if="this.type == 'insertion'">
        <span class="edit-type txt-insertion f3">insert </span>
        <span class="pa1 edit-text br-pill-ns border-insertion-all insertion_below txt-insertion">&nbsp;<slot></slot>&nbsp;</span>
      </template>
    </div>
  `,
  props: ['type'],
  created: function() {
    this.type = this.$props.type;
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
        <template v-if="isAnswer"><input class="checkbox-tools checkbox-tools-severity" type="radio" disabled checked></template>
        <template v-else><input class="checkbox-tools checkbox-tools-severity" type="radio" disabled></template>
        <label class="for-checkbox-tools-severity question-deletion"> <slot></slot> </label>
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
  props: ['isAnswer', 'type'],
  created: function() {
    this.type = this.$props.type;
    this.isAnswer = this.$props.isAnswer;
  }
});

const Edit = Vue.component('edit', {
  data (){
    return {
      answer: 0,
      question: ''
    }
  },
  template: `
    <div class="edit">
      <edit-header :type=type>{{ span }}</edit-header>
      <p class="mb2 b tracked-light">
        {{question}}
        <template v-if="this.type == 'grammar'">
          <answer-box :isAnswer="this.answer==1" :type=type>yes</answer-box>
          <answer-box :isAnswer="this.answer==2" :type=type>no</answer-box>
        </template>
      </p>
      <template v-if="this.type == 'deletion'">
        <div class="tc">
          <answer-box :isAnswer="this.answer==1" :type=type>1 - not at all</answer-box>
          <answer-box :isAnswer="this.answer==2" :type=type>2 - minor</answer-box>
          <answer-box :isAnswer="this.answer==3" :type=type>3 - somewhat</answer-box>
          <answer-box :isAnswer="this.answer==4" :type=type>4 - very much</answer-box>
        </div>
      </template>
      <template v-if="this.type == 'insertion'">
        <div class="tc">
          <answer-box :isAnswer="this.answer==1" :type=type>1 - Minor</answer-box>
          <answer-box :isAnswer="this.answer==2" :type=type>2 - Somewhat</answer-box>
          <answer-box :isAnswer="this.answer==3" :type=type>3 - A lot</answer-box>
        </div>
      </template>
    </div>
    `,
    props: ['type', 'subtype', 'span', 'answer'],
    methods: {          
      getQuestion: function() {
        switch (this.$props.type) {
          case 'deletion':
            return 'Is the deleted span significant to the main idea of the original sentence?';
          case 'grammar':
            return 'Does this deletion edit introduce any fluency / grammar error?';
          case 'insertion':
            switch (this.$props.subtype) {
              case 'elaboration':
                return 'How much it helps you to read and understand the sentence?';
              case 'hallucination':
                return 'How much it affects the main idea of the original sentence?';
            }
        }
      }
    },
    created: function() {
      this.question = this.getQuestion();
      this.answer = parseInt(this.$props.answer);
    }
});

const Substitution = Vue.component('es', {
  template: `<span class="bg-substitution-light"><slot /></span>`
});
const Insertion = Vue.component('ei', {
  template: `<span class="bg-insertion-light"><slot /></span>`
});
const Deletion = Vue.component('ed', {
  template: `<span class="bg-deletion-light"><slot /></span>`
});
const Split = Vue.component('esp', {
  template: `<span class="bg-split-light"><slot /></span>`
});
const Todo = Vue.component('todo', {
  template: `<span class="todo"><slot /></span>`
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
    'tood': Todo
  },
  methods: {
    onComplete: function() {
      alert('Complete!');
    },
    onChange: function() {
      $('html, body').animate({ scrollTop: 0 }, 'fast');
    }
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

$('#bt-1').hover(
    function() { addSpan(18, 11) },
    function() { removeSpan() }
)
$('#bt-2').hover(
  function() { addSpan(29, 8) },
  function() { removeSpan() }
)
$('#bt-3').hover(
  function() { addSpan(0, 38) },
  function() { removeSpan() }
)
$('#bt-4').hover(
  function() { addSpan(70, 11) },
  function() { removeSpan() }
)
$('#bt-5').hover(
  function() { addSpan(82, 16) },
  function() { removeSpan() }
)
$('#bt-6').hover(
  function() { addSpan(0, 38) },
  function() { removeSpan() }
)
$('#bt-7').hover(
  function() { addSpan(105, 37) },
  function() { removeSpan() }
)