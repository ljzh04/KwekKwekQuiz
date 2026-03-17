import{a9 as w,aa as p,ab as L,ac as T,ad as z,v as u,Z as f,ae as m,af as k,X as $}from"./dom-Hy2no10I.js";import"./state-DXB8aKjC.js";import{jsonStateManager as v}from"./jsonStateManager-DcOy686S.js";import{a as E,v as S}from"./utils-DegSMjii.js";import{s as B}from"./quizEngine-D93UD05L.js";import"./uiController-ESWsAtkL.js";import"./renderUtils-DfyM7FXd.js";let t=[];function X(){if(!w||!p){console.warn("Quiz builder elements not found, skipping initialization");return}w.addEventListener("click",A),L.addEventListener("click",M),T.addEventListener("click",C),z.addEventListener("click",N),Q()}function Q(){f&&f.classList.remove("hidden"),m&&m.classList.add("hidden"),k&&(k.textContent="Mode: Visual Builder")}function O(){m&&m.classList.remove("hidden"),f&&f.classList.add("hidden"),$&&($.textContent="Mode: Editor")}function M(){const e=y();u&&(u.value=JSON.stringify(e,null,2)),O()}function C(){if(u)try{const e=JSON.parse(u.value);I(e)}catch{console.warn("Could not parse JSON, starting with empty builder"),t=[],l()}Q()}function Z(){const e=y();v.setBuilderData(e),v.setMode("builder"),v.getCurrentData(),window.handleGenerateQuizRequest&&window.handleGenerateQuizRequest()}function A(){const e={id:Date.now(),type:"multiple-choice",question:"",options:["","","",""],correct:0};t.push(e),l(),setTimeout(()=>{const r=document.querySelector(`[data-question-id="${e.id}"] .question-text`);r&&r.focus()},100)}function l(){if(p){if(t.length===0){p.innerHTML=`
            <div class="empty-state text-center py-12 text-md-on-surface-variant dark:text-gray-400">
                <div class="material-symbols-outlined text-4xl mb-2 mx-auto opacity-50">quiz</div>
                <p class="text-lg font-medium">No questions yet</p>
                <p class="text-sm mt-1">Click "Add Question" to get started building your quiz</p>
            </div>
        `;return}p.innerHTML=t.map((e,r)=>J(e,r)).join(""),t.forEach((e,r)=>{F(e.id)})}}function J(e,r){let a="";if(e.type==="multiple-choice")a=e.options.map((s,c)=>`
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="${c}" 
                    id="correct-${e.id}-${c}" 
                    ${e.correct==c?"checked":""} 
                    class="correct-option">
                <label for="correct-${e.id}-${c}" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="${s||""}" 
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white" 
                        placeholder="Option ${c+1}">
                    <button type="button" class="remove-option-btn text-red-500 hover:text-red-700 p-1" 
                        data-question-id="${e.id}" data-option-idx="${c}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </label>
            </div>
        `).join("");else if(e.type==="true-false"){const s=e.correct===!0||e.correct==="true"?"checked":"",c=e.correct===!1||e.correct==="false"?"checked":"";a=`
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="true" 
                    id="correct-${e.id}-true" 
                    ${s} 
                    class="correct-option">
                <label for="correct-${e.id}-true" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="True" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="True">
                </label>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <input type="radio" name="correct-${e.id}" value="false" 
                    id="correct-${e.id}-false" 
                    ${c} 
                    class="correct-option">
                <label for="correct-${e.id}-false" class="flex items-center gap-2 flex-grow">
                    <input type="text" value="False" readonly
                        class="option-input w-full p-2 border border-md-outline rounded-md text-sm dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700" 
                        placeholder="False">
                </label>
            </div>
        `}else a=`
            <div class="mb-2">
                <label class="block text-sm font-medium mb-1 text-md-on-surface dark:text-gray-300">Correct Answer</label>
                <input type="text" value="${e.correct||""}" 
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
                    rows="2" placeholder="Enter your question here...">${e.question||""}</textarea>
            </div>
            
            <div class="options-section">
                <label class="block text-sm font-medium mb-2 text-md-on-surface dark:text-gray-300">
                    ${e.type==="multiple-choice"||e.type==="true-false"?"Options":"Answer"}
                </label>
                ${a}
                
                ${e.type==="multiple-choice"?`
                <button type="button" class="add-option-btn text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 mt-2" 
                    data-question-id="${e.id}">
                    <span class="material-symbols-outlined text-xs">add</span>
                    <span>Add Option</span>
                </button>
                `:""}
            </div>
        </div>
    `}function F(e,r){const a=document.querySelector(`[data-question-id="${e}"] .question-text`);a&&a.addEventListener("input",o=>{const i=t.findIndex(n=>n.id==e);i!==-1&&(t[i].question=o.target.value)});const s=document.querySelector(`[data-question-id="${e}"] .question-type-select`);s&&s.addEventListener("change",o=>{const i=t.findIndex(n=>n.id==e);if(i!==-1){const n=t[i].type;t[i].type=o.target.value,n!==o.target.value&&(o.target.value==="multiple-choice"?(t[i].options=["",""],t[i].correct=0):o.target.value==="true-false"?(t[i].options=["True","False"],t[i].correct=!0):t[i].correct=""),l()}}),document.querySelectorAll(`[data-question-id="${e}"] .option-input`).forEach((o,i)=>{o.addEventListener("input",n=>{const d=t.findIndex(b=>b.id==e);d!==-1&&t[d].options&&(t[d].options[i]=n.target.value)})});const x=document.querySelector(`[data-question-id="${e}"] .answer-input`);x&&x.addEventListener("input",o=>{const i=t.findIndex(n=>n.id==e);i!==-1&&(t[i].correct=o.target.value)}),document.querySelectorAll(`[data-question-id="${e}"] .correct-option`).forEach(o=>{o.addEventListener("change",i=>{const n=t.findIndex(d=>d.id==e);n!==-1&&(t[n].type==="multiple-choice"?t[n].correct=parseInt(i.target.value):t[n].type==="true-false"&&(t[n].correct=i.target.value==="true"))})});const h=document.querySelector(`[data-question-id="${e}"] .remove-question-btn`);h&&h.addEventListener("click",()=>{t=t.filter(o=>o.id!=e),l()});const g=document.querySelector(`[data-question-id="${e}"] .add-option-btn`);g&&g.addEventListener("click",()=>{const o=t.findIndex(i=>i.id==e);o!==-1&&(t[o].options.push(""),l())}),document.querySelectorAll(`[data-question-id="${e}"] .remove-option-btn`).forEach(o=>{o.addEventListener("click",i=>{const n=parseInt(i.currentTarget.dataset.optionIdx),d=t.findIndex(b=>b.id==e);d!==-1&&(t[d].options.splice(n,1),t[d].correct>=n&&(t[d].correct=Math.max(0,t[d].correct-1)),l())})})}function y(){return t.filter(r=>r.question&&r.question.trim()!=="").map(r=>{const a={type:r.type,question:r.question};return r.type==="multiple-choice"?(a.options=r.options.filter(s=>s&&s.trim()!==""),a.correct=r.correct):(r.type==="true-false"&&(a.options=["True","False"]),a.correct=r.correct),a})}function I(e){if(!Array.isArray(e)){console.error("Invalid JSON data format for quiz");return}t=e.map((r,a)=>{const s={id:Date.now()+a,type:r.type||"multiple-choice",question:r.question||""};return r.type==="multiple-choice"?(s.options=r.options||[""],s.correct=r.correct!==void 0?r.correct:0):r.type==="true-false"?(s.options=["True","False"],s.correct=r.correct!==void 0?r.correct:!0):s.correct=r.correct||"",s}),l()}function N(){const e=y();if(e.length===0){E("Cannot preview: No valid questions found. Please add at least one question.");return}if(!S(e)){E("Invalid quiz data. Please check your questions and try again.");return}u&&(u.value=JSON.stringify(e,null,2)),B(e)}export{Z as handleGenerateInBuilderMode,X as initializeQuizBuilder,I as loadQuestionsFromJson};
