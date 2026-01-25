import{o as s}from"./dom-CWtbKGwS.js";let n=null;function i(){n||(n=document.createElement("div"),n.id="toast-container",n.className="fixed top-24 right-4 ml-4 z-50 space-y-2",document.body.appendChild(n))}function o(e,t="info",a=3e3){i();const r=document.createElement("div");r.className=`
        px-4 py-3 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300 translate-x-full opacity-0
        ${d(t)}
    `;const l=u(t);return r.innerHTML=`
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">${l}</div>
            <div class="flex-1 text-sm font-medium">${e}</div>
            <button class="flex-shrink-0 ml-2 text-current opacity-70 hover:opacity-100 transition-opacity" onclick="this.parentElement.parentElement.remove()">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `,n.appendChild(r),setTimeout(()=>{r.classList.remove("translate-x-full","opacity-0")},10),a>0&&setTimeout(()=>{c(r)},a),r}function c(e){e&&e.parentNode&&(e.classList.add("translate-x-full","opacity-0"),setTimeout(()=>{e.parentNode&&e.remove()},300))}function d(e){const t="text-white";switch(e){case"success":return`${t} bg-green-600 dark:bg-green-700`;case"error":return`${t} bg-red-600 dark:bg-red-700`;case"warning":return`${t} bg-yellow-600 dark:bg-yellow-700`;case"info":default:return`${t} bg-blue-600 dark:bg-blue-700`}}function u(e){switch(e){case"success":return`<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>`;case"error":return`<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>`;case"warning":return`<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>`;case"info":default:return`<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>`}}function v(e){const t=e.slice();for(let a=t.length-1;a>0;a--){const r=Math.floor(Math.random()*(a+1));[t[a],t[r]]=[t[r],t[a]]}return t}function h(e){if(!Array.isArray(e))return!1;for(const t of e)if(typeof t!="object"||!t.type||!t.question||t.correct===void 0||t.type==="multiple-choice"&&(!Array.isArray(t.options)||t.options.length===0))return!1;return!0}function p(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function g(e){return e?["bg-green-100","border-green-600","text-green-800","dark:bg-green-900","dark:border-green-500","dark:text-green-200"]:["bg-red-100","border-red-600","text-red-800","dark:bg-red-900","dark:border-red-500","dark:text-red-200"]}function m(e){o(e,"error",5e3)}function x(){s&&!s.classList.contains("hidden")&&(s.textContent="",s.classList.add("hidden"))}function w(e){o(e,"success",3e3)}function b(e){o(e,"info",3e3)}export{m as a,p as b,x as c,b as d,v as e,g,w as s,h as v};
