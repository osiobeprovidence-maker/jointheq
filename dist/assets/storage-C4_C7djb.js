import{e as s}from"./index-D5L0m8xR.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M4.929 4.929 19.07 19.071",key:"196cmz"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],k=s("ban",g);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M13 21h8",key:"1jsn5i"}],["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],P=s("pen-line",u);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["circle",{cx:"9",cy:"12",r:"3",key:"u3jwor"}],["rect",{width:"20",height:"14",x:"2",y:"5",rx:"7",key:"g7kal2"}]],_=s("toggle-left",m);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["circle",{cx:"15",cy:"12",r:"3",key:"1afu0r"}],["rect",{width:"20",height:"14",x:"2",y:"5",rx:"7",key:"g7kal2"}]],x=s("toggle-right",w),y=["image/jpg","image/jpeg","image/png","image/webp","image/svg+xml"],h=5*1024*1024;function f(a){return y.includes(a.type)?a.size>h?"File too large. Maximum size: 5MB":null:"Invalid file type. Allowed: JPG, JPEG, PNG, WebP, SVG"}async function E(a,o=3){let l;for(let t=1;t<=o;t++)try{return await a()}catch(r){l=r,console.warn(`generateUploadUrl attempt ${t}/${o} failed:`,r),t<o&&await new Promise(c=>setTimeout(c,t*1e3))}throw console.error("generateUploadUrl failed after",o,"attempts:",l),new Error("Unable to prepare file upload. Image upload service is temporarily unavailable.")}async function v(a,o,l,t){const r=f(a);if(r)throw new Error(r);const c=await E(o);return new Promise((p,i)=>{const e=new XMLHttpRequest;e.timeout=6e4,e.upload.onprogress=n=>{n.lengthComputable&&t&&t(Math.round(n.loaded/n.total*100))},e.onload=async()=>{if(e.status>=200&&e.status<300)try{const{storageId:n}=JSON.parse(e.responseText),d=await l({storageId:n});p(d)}catch{i(new Error("Failed to resolve upload URL"))}else i(new Error("Upload failed with status "+e.status))},e.onerror=()=>i(new Error("Network error while uploading image.")),e.ontimeout=()=>i(new Error("Upload failed. Please try again.")),e.open("POST",c),e.send(a)})}export{k as B,P,x as T,_ as a,v as u,f as v};
