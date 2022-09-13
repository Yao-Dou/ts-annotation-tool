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
  }
})