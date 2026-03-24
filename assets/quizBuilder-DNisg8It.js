import{al as p,am as u,an as y,ao as h,ap as v,w as f,D as $,F as b}from"./utils-BNotHhKt.js";import"./state-gvIdnmu0.js";import{jsonStateManager as o}from"./jsonStateManager-Dyk-VSVS.js";import{s as k}from"./quizEngine-Bc_9W8AD.js";import{switchInputMode as g}from"./uiController-BHD7S3k0.js";import"./renderUtils-C8-Cw9sA.js";import"./purify.es-DMIOmkOx.js";function D(){if(!p||!u){console.warn("Quiz builder elements not found, skipping initialization");return}o.subscribe(()=>{o.isBuilderMode()&&S()}),p.addEventListener("click",w),y.addEventListener("click",()=>g("editor")),h.addEventListener("click",()=>g("builder")),v.addEventListener("click",j)}function w(){const e=o.getQuestions(),r={id:Date.now(),type:"multiple-choice",question:"",options:["","","",""],correct:0};e.push(r),o.setQuestions(e),setTimeout(()=>{const i=document.querySelector(`[data-question-id="${r.id}"] .question-text`);i&&i.focus()},100)}function Q(e){const r=o.getQuestions().filter(i=>i.id!==e);o.setQuestions(r)}function x(e,r,i){const t=o.getQuestions(),n=t.find(a=>a.id===e);n&&(n[r]=i,o._questions=t)}function E(e,r){const i=o.getQuestions(),t=i.find(n=>n.id===e);!t||t.type===r||(t.type,t.type=r,r==="multiple-choice"?(t.options=["",""],t.correct=0,delete t.items,delete t.left,delete t.right):r==="true-false"?(t.options=["True","False"],t.correct=!0,delete t.items,delete t.left,delete t.right):r==="enumeration-any-order"||r==="enumeration-ordered"?(t.items=["","",""],t.correct=["","",""],delete t.options,delete t.left,delete t.right):r==="matching"?(t.left=["",""],t.right=["",""],t.correct={0:0,1:1},delete t.options,delete t.items):(delete t.options,delete t.items,delete t.left,delete t.right,t.correct=""),o.setQuestions(i))}function L(e,r,i){const t=o.getQuestions(),n=t.find(a=>a.id===e);!n||!n.options||(n.options[r]=i,o._questions=t)}function C(e,r){const i=o.getQuestions(),t=i.find(n=>n.id===e);t&&(t.type==="multiple-choice"?t.correct=parseInt(r,10):t.type==="true-false"&&(t.correct=r==="true"),o._questions=i)}function z(e){const r=o.getQuestions(),i=r.find(t=>t.id===e);!i||!i.options||(i.options.push(""),o.setQuestions(r))}function M(e,r){const i=o.getQuestions(),t=i.find(n=>n.id===e);!t||!t.options||(t.options.splice(r,1),typeof t.correct=="number"&&t.correct>=r&&(t.correct=Math.max(0,t.correct-1)),o.setQuestions(i))}function S(){if(!u)return;const e=o.getQuestions();if(e.length===0){u.innerHTML=`
            <div class="empty-state text-center py-12 text-md-on-surface-variant dark:text-gray-400">
                <div class="material-symbols-outlined text-4xl mb-2 mx-auto opacity-50">quiz</div>
                <p class="text-lg font-medium">No questions yet</p>
                <p class="text-sm mt-1">Click "Add Question" to get started building your quiz</p>
            </div>
        `;return}u.innerHTML=e.map((r,i)=>A(r,i)).join(""),e.forEach(r=>O(r.id))}function A(e,r){let i="";if(e.type==="multiple-choice")i=(e.options||[]).map((t,n)=>`
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="${n}" 
                    id="correct-${e.id}-${n}" 
                    ${e.correct==n?"checked":""} 
                    class="correct-option">
                <label for="correct-${e.id}-${n}" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="${c(t||"")}" 
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                        placeholder="Option ${n+1}">
                    <button type="button" class="remove-option-btn text-red-500 hover:text-red-700 p-1" 
                        data-question-id="${e.id}" data-option-idx="${n}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </label>
            </div>
        `).join("");else if(e.type==="true-false"){const t=e.correct===!0||e.correct==="true"?"checked":"",n=e.correct===!1||e.correct==="false"?"checked":"";i=`
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
                    id="correct-${e.id}-false" ${n} class="correct-option">
                <label for="correct-${e.id}-false" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="False" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="False">
                </label>
            </div>
        `}else if(e.type==="enumeration-any-order"||e.type==="enumeration-ordered"){const t=e.items||[];e.correct,i=`
            <div class="enumeration-items space-y-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Items to Enumerate</label>
                ${t.map((n,a)=>`
                    <div class="flex items-center gap-2 mb-2">
                        <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-xs">${a+1}</span>
                        <input type="text" value="${c(n||"")}" 
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
        `}else if(e.type==="matching"){const t=e.left||[],n=e.right||[];i=`
            <div class="matching-items space-y-4">
                <div class="left-column">
                    <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Left Column (Items to Match)</label>
                    ${t.map((a,s)=>`
                        <div class="flex items-center gap-2 mb-2">
                            <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold text-xs">${s+1}</span>
                            <input type="text" value="${c(a||"")}" 
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
                    ${n.map((a,s)=>`
                        <div class="flex items-center gap-2 mb-2">
                            <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold text-xs">${String.fromCharCode(65+s)}</span>
                            <input type="text" value="${c(a||"")}" 
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
        `}else i=`
            <div class="mb-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Correct Answer</label>
                <input type="text" value="${c(e.correct||"")}" 
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
                    rows="2" placeholder="Enter your question here...">${B(e.question||"")}</textarea>
            </div>
            
            <div class="options-section">
                <label class="block text-sm font-medium mb-2 text-md-on-surface dark:text-gray-300">
                    ${e.type==="multiple-choice"||e.type==="true-false"?"Options":e.type==="enumeration-any-order"||e.type==="enumeration-ordered"?"Items to Enumerate":e.type==="matching"?"Matching Items":"Answer"}
                </label>
                ${i}
                
                ${e.type==="multiple-choice"?`
                <button type="button" class="add-option-btn text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mt-2" 
                    data-question-id="${e.id}">
                    <span class="material-symbols-outlined text-xs">add</span>
                    <span>Add Option</span>
                </button>
                `:""}
            </div>
        </div>
    `}function O(e){const r=document.querySelector(`[data-question-id="${e}"]`);if(!r)return;const i=r.querySelector(".question-text");i&&i.addEventListener("input",l=>x(e,"question",l.target.value));const t=r.querySelector(".question-type-select");t&&t.addEventListener("change",l=>E(e,l.target.value)),r.querySelectorAll(".option-input").forEach((l,d)=>{l.readOnly||l.addEventListener("input",m=>L(e,d,m.target.value))});const n=r.querySelector(".answer-input");n&&n.addEventListener("input",l=>x(e,"correct",l.target.value)),r.querySelectorAll(".correct-option").forEach(l=>{l.addEventListener("change",d=>C(e,d.target.value))});const a=r.querySelector(".remove-question-btn");a&&a.addEventListener("click",()=>Q(e));const s=r.querySelector(".add-option-btn");s&&s.addEventListener("click",()=>z(e)),r.querySelectorAll(".remove-option-btn").forEach(l=>{l.addEventListener("click",d=>{const m=parseInt(d.currentTarget.dataset.optionIdx,10);M(e,m)})})}function T(){return o.getQuestions().filter(e=>e.question&&e.question.trim()!=="").map(e=>{const r={type:e.type,question:e.question};return e.type==="multiple-choice"?(r.options=(e.options||[]).filter(i=>i&&i.trim()!==""),r.correct=e.correct):e.type==="true-false"?(r.options=["True","False"],r.correct=e.correct):e.type==="enumeration-any-order"||e.type==="enumeration-ordered"?(r.items=(e.items||[]).filter(i=>i&&i.trim()!==""),r.correct=(e.correct||[]).filter(i=>i&&i.trim()!=="")):e.type==="matching"?(r.left=(e.left||[]).filter(i=>i&&i.trim()!==""),r.right=(e.right||[]).filter(i=>i&&i.trim()!==""),r.correct=e.correct||{}):r.correct=e.correct,r})}function P(e){const i=(Array.isArray(e)?e:[e]).map((t,n)=>({id:Date.now()+n,type:t.type||"multiple-choice",question:t.question||"",...t.type==="multiple-choice"?{options:t.options||[""],correct:t.correct!==void 0?t.correct:0}:t.type==="true-false"?{options:["True","False"],correct:t.correct!==void 0?t.correct:!0}:t.type==="enumeration-any-order"||t.type==="enumeration-ordered"?{items:t.items||[""],correct:t.correct||[""]}:t.type==="matching"?{left:t.left||[""],right:t.right||[""],correct:t.correct||{}}:{correct:t.correct||""}}));o.setQuestions(i)}function K(){window.handleGenerateQuizRequest&&window.handleGenerateQuizRequest()}function j(){const e=T();if(e.length===0){f("Cannot preview: No valid questions found. Please add at least one question.");return}if(!$(e)){f("Invalid quiz data. Please check your questions and try again.");return}const r=JSON.stringify(e,null,2);b&&(b.value=r),o.setRawEditorText(r),k(e)}function B(e){const r=document.createElement("div");return r.textContent=e,r.innerHTML}function c(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}export{K as handleGenerateInBuilderMode,D as initializeQuizBuilder,P as loadQuestionsFromJson};
