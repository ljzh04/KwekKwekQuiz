import{al as p,am as l,an as v,ao as x,ap as h,w as f,D as k,F as m}from"./utils-Dznu4QyQ.js";import"./state-DXB8aKjC.js";import{jsonStateManager as n}from"./jsonStateManager-DJXBx3cm.js";import{s as w}from"./quizEngine-BOs55Yl6.js";import{switchInputMode as b}from"./uiController-B_2epuSv.js";import"./renderUtils-C8-Cw9sA.js";import"./purify.es-DMIOmkOx.js";function _(){if(!p||!l){console.warn("Quiz builder elements not found, skipping initialization");return}n.subscribe(()=>{n.isBuilderMode()&&M()}),p.addEventListener("click",Q),v.addEventListener("click",()=>b("editor")),x.addEventListener("click",()=>b("builder")),h.addEventListener("click",B)}function Q(){const e=n.getQuestions(),t={id:Date.now(),type:"multiple-choice",question:"",options:["","","",""],correct:0};e.push(t),n.setQuestions(e),setTimeout(()=>{const o=document.querySelector(`[data-question-id="${t.id}"] .question-text`);o&&o.focus()},100)}function $(e){const t=n.getQuestions().filter(o=>o.id!==e);n.setQuestions(t)}function y(e,t,o){const r=n.getQuestions(),i=r.find(a=>a.id===e);i&&(i[t]=o,n._questions=r)}function E(e,t){const o=n.getQuestions(),r=o.find(i=>i.id===e);!r||r.type===t||(r.type,r.type=t,t==="multiple-choice"?(r.options=["",""],r.correct=0):t==="true-false"?(r.options=["True","False"],r.correct=!0):(delete r.options,r.correct=""),n.setQuestions(o))}function L(e,t,o){const r=n.getQuestions(),i=r.find(a=>a.id===e);!i||!i.options||(i.options[t]=o,n._questions=r)}function T(e,t){const o=n.getQuestions(),r=o.find(i=>i.id===e);r&&(r.type==="multiple-choice"?r.correct=parseInt(t,10):r.type==="true-false"&&(r.correct=t==="true"),n._questions=o)}function z(e){const t=n.getQuestions(),o=t.find(r=>r.id===e);!o||!o.options||(o.options.push(""),n.setQuestions(t))}function S(e,t){const o=n.getQuestions(),r=o.find(i=>i.id===e);!r||!r.options||(r.options.splice(t,1),typeof r.correct=="number"&&r.correct>=t&&(r.correct=Math.max(0,r.correct-1)),n.setQuestions(o))}function M(){if(!l)return;const e=n.getQuestions();if(e.length===0){l.innerHTML=`
            <div class="empty-state text-center py-12 text-md-on-surface-variant dark:text-gray-400">
                <div class="material-symbols-outlined text-4xl mb-2 mx-auto opacity-50">quiz</div>
                <p class="text-lg font-medium">No questions yet</p>
                <p class="text-sm mt-1">Click "Add Question" to get started building your quiz</p>
            </div>
        `;return}l.innerHTML=e.map((t,o)=>q(t,o)).join(""),e.forEach(t=>A(t.id))}function q(e,t){let o="";if(e.type==="multiple-choice")o=(e.options||[]).map((r,i)=>`
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="${i}" 
                    id="correct-${e.id}-${i}" 
                    ${e.correct==i?"checked":""} 
                    class="correct-option">
                <label for="correct-${e.id}-${i}" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="${g(r||"")}" 
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                        placeholder="Option ${i+1}">
                    <button type="button" class="remove-option-btn text-red-500 hover:text-red-700 p-1" 
                        data-question-id="${e.id}" data-option-idx="${i}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </label>
            </div>
        `).join("");else if(e.type==="true-false"){const r=e.correct===!0||e.correct==="true"?"checked":"",i=e.correct===!1||e.correct==="false"?"checked":"";o=`
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="true" 
                    id="correct-${e.id}-true" ${r} class="correct-option">
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
        `}else o=`
            <div class="mb-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Correct Answer</label>
                <input type="text" value="${g(e.correct||"")}" 
                    class="answer-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                    placeholder="Enter the correct answer">
            </div>
        `;return`
        <div class="question-card border border-md-outline dark:border-gray-600 rounded-lg p-4 bg-md-surface dark:bg-gray-800" data-question-id="${e.id}">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-md-on-surface dark:text-gray-200">Question ${t+1}</h4>
                <div class="flex gap-1">
                    <select class="question-type-select text-sm p-1 border border-md-outline rounded-md dark:bg-gray-800 dark:text-white">
                        <option value="multiple-choice" ${e.type==="multiple-choice"?"selected":""}>Multiple Choice</option>
                        <option value="true-false" ${e.type==="true-false"?"selected":""}>True/False</option>
                        <option value="fill-in-the-blank" ${e.type==="fill-in-the-blank"?"selected":""}>Fill-in-the-blank</option>
                        <option value="identification" ${e.type==="identification"?"selected":""}>Identification</option>
                        <option value="short-answer" ${e.type==="short-answer"?"selected":""}>Short Answer</option>
                    </select>
                    <button type="button" class="remove-question-btn text-red-500 hover:text-red-700 p-1" data-question-id="${e.id}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Question Text</label>
                <textarea class="question-text w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                    rows="2" placeholder="Enter your question here...">${C(e.question||"")}</textarea>
            </div>
            
            <div class="options-section">
                <label class="block text-sm font-medium mb-2 text-md-on-surface dark:text-gray-300">
                    ${e.type==="multiple-choice"||e.type==="true-false"?"Options":"Answer"}
                </label>
                ${o}
                
                ${e.type==="multiple-choice"?`
                <button type="button" class="add-option-btn text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mt-2" 
                    data-question-id="${e.id}">
                    <span class="material-symbols-outlined text-xs">add</span>
                    <span>Add Option</span>
                </button>
                `:""}
            </div>
        </div>
    `}function A(e){const t=document.querySelector(`[data-question-id="${e}"]`);if(!t)return;const o=t.querySelector(".question-text");o&&o.addEventListener("input",s=>y(e,"question",s.target.value));const r=t.querySelector(".question-type-select");r&&r.addEventListener("change",s=>E(e,s.target.value)),t.querySelectorAll(".option-input").forEach((s,c)=>{s.readOnly||s.addEventListener("input",d=>L(e,c,d.target.value))});const i=t.querySelector(".answer-input");i&&i.addEventListener("input",s=>y(e,"correct",s.target.value)),t.querySelectorAll(".correct-option").forEach(s=>{s.addEventListener("change",c=>T(e,c.target.value))});const a=t.querySelector(".remove-question-btn");a&&a.addEventListener("click",()=>$(e));const u=t.querySelector(".add-option-btn");u&&u.addEventListener("click",()=>z(e)),t.querySelectorAll(".remove-option-btn").forEach(s=>{s.addEventListener("click",c=>{const d=parseInt(c.currentTarget.dataset.optionIdx,10);S(e,d)})})}function O(){return n.getQuestions().filter(e=>e.question&&e.question.trim()!=="").map(e=>{const t={type:e.type,question:e.question};return e.type==="multiple-choice"?(t.options=(e.options||[]).filter(o=>o&&o.trim()!==""),t.correct=e.correct):(e.type==="true-false"&&(t.options=["True","False"]),t.correct=e.correct),t})}function D(e){const o=(Array.isArray(e)?e:[e]).map((r,i)=>({id:Date.now()+i,type:r.type||"multiple-choice",question:r.question||"",...r.type==="multiple-choice"?{options:r.options||[""],correct:r.correct!==void 0?r.correct:0}:r.type==="true-false"?{options:["True","False"],correct:r.correct!==void 0?r.correct:!0}:{correct:r.correct||""}}));n.setQuestions(o)}function P(){window.handleGenerateQuizRequest&&window.handleGenerateQuizRequest()}function B(){const e=O();if(e.length===0){f("Cannot preview: No valid questions found. Please add at least one question.");return}if(!k(e)){f("Invalid quiz data. Please check your questions and try again.");return}const t=JSON.stringify(e,null,2);m&&(m.value=t),n.setRawEditorText(t),w(e)}function C(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function g(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}export{P as handleGenerateInBuilderMode,_ as initializeQuizBuilder,D as loadQuestionsFromJson};
