import{al as b,am as p,an as v,ao as $,ap as k,w as g,D as w,F as x}from"./utils-BKhKxfUP.js";import"./state-gvIdnmu0.js";import{j as o}from"./jsonStateManager-z86J8HyQ.js";import{s as Q}from"./quizEngine-C9iwvxdy.js";import{switchInputMode as h}from"./uiController-C4F_icfU.js";import"./renderUtils-D62RTDvE.js";import"./purify.es-DMIOmkOx.js";function I(){if(!b||!p){console.warn("Quiz builder elements not found, skipping initialization");return}o.subscribe(()=>{o.isBuilderMode()&&A()}),b.addEventListener("click",E),v.addEventListener("click",()=>h("editor")),$.addEventListener("click",()=>h("builder")),k.addEventListener("click",N)}function E(){const e=o.getQuestions(),r={id:Date.now(),type:"multiple-choice",question:"",options:["","","",""],correct:0};e.push(r),o.setQuestions(e),setTimeout(()=>{const n=document.querySelector(`[data-question-id="${r.id}"] .question-text`);n&&n.focus()},100)}function L(e){const r=o.getQuestions().filter(n=>n.id!==e);o.setQuestions(r)}function y(e,r,n){const t=o.getQuestions(),i=t.find(a=>a.id===e);i&&(i[r]=n,o._questions=t)}function M(e,r){const n=o.getQuestions(),t=n.find(i=>i.id===e);!t||t.type===r||(t.type,t.type=r,r==="multiple-choice"?(t.options=["",""],t.correct=0,delete t.items,delete t.left,delete t.right):r==="true-false"?(t.options=["True","False"],t.correct=!0,delete t.items,delete t.left,delete t.right):r==="enumeration-any-order"||r==="enumeration-ordered"?(t.items=["","",""],t.correct=["","",""],delete t.options,delete t.left,delete t.right):r==="matching"?(t.left=["",""],t.right=["",""],t.correct={0:0,1:1},delete t.options,delete t.items):(delete t.options,delete t.items,delete t.left,delete t.right,t.correct=""),o.setQuestions(n))}function S(e,r,n){const t=o.getQuestions(),i=t.find(a=>a.id===e);!i||!i.options||(i.options[r]=n,o._questions=t)}function C(e,r){const n=o.getQuestions(),t=n.find(i=>i.id===e);t&&(t.type==="multiple-choice"?t.correct=parseInt(r,10):t.type==="true-false"&&(t.correct=r==="true"),o._questions=n)}function z(e){const r=o.getQuestions(),n=r.find(t=>t.id===e);!n||!n.options||(n.options.push(""),o.setQuestions(r))}function O(e,r){const n=o.getQuestions(),t=n.find(i=>i.id===e);!t||!t.options||(t.options.splice(r,1),typeof t.correct=="number"&&t.correct>=r&&(t.correct=Math.max(0,t.correct-1)),o.setQuestions(n))}function A(){if(!p)return;const e=o.getQuestions();if(e.length===0){p.innerHTML=`
            <div class="empty-state text-center py-12 text-md-on-surface-variant dark:text-gray-400">
                <div class="material-symbols-outlined text-4xl mb-2 mx-auto opacity-50">quiz</div>
                <p class="text-lg font-medium">No questions yet</p>
                <p class="text-sm mt-1">Click "Add Question" to get started building your quiz</p>
            </div>
        `;return}p.innerHTML=e.map((r,n)=>T(r,n)).join(""),e.forEach(r=>j(r.id))}function T(e,r){let n="";if(e.type==="multiple-choice")n=(e.options||[]).map((t,i)=>`
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="${i}" 
                    id="correct-${e.id}-${i}" 
                    ${e.correct==i?"checked":""} 
                    class="correct-option">
                <label for="correct-${e.id}-${i}" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="${u(t||"")}" 
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                        placeholder="Option ${i+1}">
                    <button type="button" class="remove-option-btn text-red-500 hover:text-red-700 p-1" 
                        data-question-id="${e.id}" data-option-idx="${i}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </label>
            </div>
        `).join("");else if(e.type==="true-false"){const t=e.correct===!0||e.correct==="true"?"checked":"",i=e.correct===!1||e.correct==="false"?"checked":"";n=`
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="true" 
                    id="correct-${e.id}-true" ${t} class="correct-option">
                <label for="correct-${e.id}-true" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="True" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="True">
                </label>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="false" 
                    id="correct-${e.id}-false" ${i} class="correct-option">
                <label for="correct-${e.id}-false" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="False" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="False">
                </label>
            </div>
        `}else if(e.type==="enumeration-any-order"||e.type==="enumeration-ordered"){const t=e.items||[];e.correct,n=`
            <div class="enumeration-items space-y-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Items to Enumerate</label>
                ${t.map((i,a)=>`
                    <div class="flex items-center gap-2 mb-2">
                        <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-xs">${a+1}</span>
                        <input type="text" value="${u(i||"")}" 
                            class="enumeration-item-input flex-grow p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                            placeholder="Item ${a+1}"
                            data-question-id="${e.id}" data-item-idx="${a}">
                        <button type="button" class="remove-enumeration-item-btn text-red-500 hover:text-red-700 p-1" 
                            data-question-id="${e.id}" data-item-idx="${a}">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                `).join("")}
                <button type="button" class="add-enumeration-item-btn text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mt-2" 
                    data-question-id="${e.id}">
                    <span class="material-symbols-outlined text-xs">add</span>
                    <span>Add Item</span>
                </button>
            </div>
        `}else if(e.type==="matching"){const t=e.left||[],i=e.right||[];n=`
            <div class="matching-items space-y-4">
                <div class="left-column">
                    <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Left Column (Items to Match)</label>
                    ${t.map((a,s)=>`
                        <div class="flex items-center gap-2 mb-2">
                            <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-xs">${s+1}</span>
                            <input type="text" value="${u(a||"")}" 
                                class="matching-left-input flex-grow p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                                placeholder="Left item ${s+1}"
                                data-question-id="${e.id}" data-left-idx="${s}">
                            <button type="button" class="remove-matching-left-btn text-red-500 hover:text-red-700 p-1" 
                                data-question-id="${e.id}" data-left-idx="${s}">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    `).join("")}
                    <button type="button" class="add-matching-left-btn text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mt-2" 
                        data-question-id="${e.id}">
                        <span class="material-symbols-outlined text-xs">add</span>
                        <span>Add Left Item</span>
                    </button>
                </div>
                <div class="right-column">
                    <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Right Column (Options)</label>
                    ${i.map((a,s)=>`
                        <div class="flex items-center gap-2 mb-2">
                            <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold text-xs">${String.fromCharCode(65+s)}</span>
                            <input type="text" value="${u(a||"")}" 
                                class="matching-right-input flex-grow p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                                placeholder="Right item ${String.fromCharCode(65+s)}"
                                data-question-id="${e.id}" data-right-idx="${s}">
                            <button type="button" class="remove-matching-right-btn text-red-500 hover:text-red-700 p-1" 
                                data-question-id="${e.id}" data-right-idx="${s}">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    `).join("")}
                    <button type="button" class="add-matching-right-btn text-sm text-green-500 hover:text-green-700 font-medium flex items-center gap-1 mt-2" 
                        data-question-id="${e.id}">
                        <span class="material-symbols-outlined text-xs">add</span>
                        <span>Add Right Item</span>
                    </button>
                </div>
            </div>
        `}else n=`
            <div class="mb-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Correct Answer</label>
                <input type="text" value="${u(e.correct||"")}" 
                    class="answer-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                    placeholder="Enter the correct answer">
            </div>
        `;return`
        <div class="question-card border border-md-outline dark:border-gray-600 rounded-lg p-4 bg-md-surface dark:bg-gray-800" data-question-id="${e.id}">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-md-on-surface dark:text-gray-200">Question ${r+1}</h4>
                <div class="flex gap-1">
                    <select class="question-type-select text-sm p-1 border border-md-outline rounded-md dark:bg-gray-800 dark:text-white">
                        <option value="multiple-choice" ${e.type==="multiple-choice"?"selected":""}>Multiple Choice</option>
                        <option value="true-false" ${e.type==="true-false"?"selected":""}>True/False</option>
                        <option value="fill-in-the-blank" ${e.type==="fill-in-the-blank"?"selected":""}>Fill-in-the-blank</option>
                        <option value="identification" ${e.type==="identification"?"selected":""}>Identification</option>
                        <option value="enumeration-any-order" ${e.type==="enumeration-any-order"?"selected":""}>Enumeration (Any Order)</option>
                        <option value="enumeration-ordered" ${e.type==="enumeration-ordered"?"selected":""}>Enumeration (Ordered)</option>
                        <option value="matching" ${e.type==="matching"?"selected":""}>Matching</option>
                    </select>
                    <button type="button" class="remove-question-btn text-red-500 hover:text-red-700 p-1" data-question-id="${e.id}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Question Text</label>
                <textarea class="question-text w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                    rows="2" placeholder="Enter your question here...">${R(e.question||"")}</textarea>
            </div>
            
            <div class="options-section">
                <label class="block text-sm font-medium mb-2 text-md-on-surface dark:text-gray-300">
                    ${e.type==="multiple-choice"||e.type==="true-false"?"Options":e.type==="enumeration-any-order"||e.type==="enumeration-ordered"?"Items to Enumerate":e.type==="matching"?"Matching Items":"Answer"}
                </label>
                ${n}
                
                ${e.type==="multiple-choice"?`
                <button type="button" class="add-option-btn text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mt-2" 
                    data-question-id="${e.id}">
                    <span class="material-symbols-outlined text-xs">add</span>
                    <span>Add Option</span>
                </button>
                `:""}
            </div>
        </div>
    `}function j(e){const r=document.querySelector(`[data-question-id="${e}"]`);if(!r)return;const n=r.querySelector(".question-text");n&&n.addEventListener("input",l=>y(e,"question",l.target.value));const t=r.querySelector(".question-type-select");t&&t.addEventListener("change",l=>M(e,l.target.value)),r.querySelectorAll(".option-input").forEach((l,d)=>{l.readOnly||l.addEventListener("input",c=>S(e,d,c.target.value))});const i=r.querySelector(".answer-input");i&&i.addEventListener("input",l=>y(e,"correct",l.target.value)),r.querySelectorAll(".correct-option").forEach(l=>{l.addEventListener("change",d=>C(e,d.target.value))});const a=r.querySelector(".remove-question-btn");a&&a.addEventListener("click",()=>L(e));const s=r.querySelector(".add-option-btn");s&&s.addEventListener("click",()=>z(e)),r.querySelectorAll(".remove-option-btn").forEach(l=>{l.addEventListener("click",d=>{const c=parseInt(d.currentTarget.dataset.optionIdx,10);O(e,c)})})}function B(e,r,n){const t=[],i=new Map;(e||[]).forEach((d,c)=>{d&&String(d).trim()!==""&&(i.set(c,t.length),t.push(d))});const a=[],s=new Map;(r||[]).forEach((d,c)=>{d&&String(d).trim()!==""&&(s.set(c,a.length),a.push(d))});const l={};if(n&&typeof n=="object")for(const[d,c]of Object.entries(n)){const m=Number(d),f=Number(c);!Number.isInteger(m)||!Number.isInteger(f)||!i.has(m)||!s.has(f)||(l[String(i.get(m))]=s.get(f))}return{left:t,right:a,correct:l}}function F(){return o.getQuestions().filter(e=>e.question&&e.question.trim()!=="").map(e=>{const r={type:e.type,question:e.question};if(e.type==="multiple-choice")r.options=(e.options||[]).filter(n=>n&&n.trim()!==""),r.correct=e.correct;else if(e.type==="true-false")r.options=["True","False"],r.correct=e.correct;else if(e.type==="enumeration-any-order"||e.type==="enumeration-ordered")r.items=(e.items||[]).filter(n=>n&&n.trim()!==""),r.correct=(e.correct||[]).filter(n=>n&&n.trim()!=="");else if(e.type==="matching"){const n=B(e.left||[],e.right||[],e.correct||{});r.left=n.left,r.right=n.right,r.correct=n.correct}else r.correct=e.correct;return r})}function U(e){const n=(Array.isArray(e)?e:[e]).map((t,i)=>({id:Date.now()+i,type:t.type||"multiple-choice",question:t.question||"",...t.type==="multiple-choice"?{options:t.options||[""],correct:t.correct!==void 0?t.correct:0}:t.type==="true-false"?{options:["True","False"],correct:t.correct!==void 0?t.correct:!0}:t.type==="enumeration-any-order"||t.type==="enumeration-ordered"?{items:t.items||[""],correct:t.correct||[""]}:t.type==="matching"?{left:t.left||[""],right:t.right||[""],correct:t.correct||{}}:{correct:t.correct||""}}));o.setQuestions(n)}function V(){window.handleGenerateQuizRequest&&window.handleGenerateQuizRequest()}function N(){const e=F();if(e.length===0){g("Cannot preview: No valid questions found. Please add at least one question.");return}if(!w(e)){g("Invalid quiz data. Please check your questions and try again.");return}const r=JSON.stringify(e,null,2);x&&(x.value=r),o.setRawEditorText(r),Q(e)}function R(e){const r=document.createElement("div");return r.textContent=e,r.innerHTML}function u(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}export{V as handleGenerateInBuilderMode,I as initializeQuizBuilder,U as loadQuestionsFromJson,B as remapMatchingCorrect};
