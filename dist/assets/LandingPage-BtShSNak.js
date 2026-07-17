import{r as k,u as fn,a as G,b as Rt,c as mn,d as ue,j as i,A as pn,m as b}from"./index-D5L0m8xR.js";import{a as T}from"./api-BWVbuEZh.js";import{L as fe}from"./Logo-Ds3QmWy4.js";import{S as Ot}from"./shield-check-aIZA0FG3.js";import{A as gn}from"./arrow-right-D2teiK-f.js";import{U as Dt}from"./users-Dcyvxbt0.js";import{Z as bn}from"./zap-CK2V2X2J.js";import{C as xn}from"./circle-x-CqiyLlU4.js";import{C as yn}from"./circle-check-Hoeq9p5w.js";import{S as wn}from"./smartphone-DJ02K19x.js";import{L as Te}from"./lock-CB11tRye.js";import{M as Lt}from"./mail-3kYMa3bc.js";import{U as vn}from"./user-ULUB4Yxn.js";import{P as _n}from"./phone-KYBh9F1V.js";const In=()=>{};var Mt={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ms=function(s){const e=[];let t=0;for(let n=0;n<s.length;n++){let r=s.charCodeAt(n);r<128?e[t++]=r:r<2048?(e[t++]=r>>6|192,e[t++]=r&63|128):(r&64512)===55296&&n+1<s.length&&(s.charCodeAt(n+1)&64512)===56320?(r=65536+((r&1023)<<10)+(s.charCodeAt(++n)&1023),e[t++]=r>>18|240,e[t++]=r>>12&63|128,e[t++]=r>>6&63|128,e[t++]=r&63|128):(e[t++]=r>>12|224,e[t++]=r>>6&63|128,e[t++]=r&63|128)}return e},kn=function(s){const e=[];let t=0,n=0;for(;t<s.length;){const r=s[t++];if(r<128)e[n++]=String.fromCharCode(r);else if(r>191&&r<224){const a=s[t++];e[n++]=String.fromCharCode((r&31)<<6|a&63)}else if(r>239&&r<365){const a=s[t++],o=s[t++],c=s[t++],l=((r&7)<<18|(a&63)<<12|(o&63)<<6|c&63)-65536;e[n++]=String.fromCharCode(55296+(l>>10)),e[n++]=String.fromCharCode(56320+(l&1023))}else{const a=s[t++],o=s[t++];e[n++]=String.fromCharCode((r&15)<<12|(a&63)<<6|o&63)}}return e.join("")},ps={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(s,e){if(!Array.isArray(s))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let r=0;r<s.length;r+=3){const a=s[r],o=r+1<s.length,c=o?s[r+1]:0,l=r+2<s.length,d=l?s[r+2]:0,m=a>>2,p=(a&3)<<4|c>>4;let x=(c&15)<<2|d>>6,I=d&63;l||(I=64,o||(x=64)),n.push(t[m],t[p],t[x],t[I])}return n.join("")},encodeString(s,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(s):this.encodeByteArray(ms(s),e)},decodeString(s,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(s):kn(this.decodeStringToByteArray(s,e))},decodeStringToByteArray(s,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let r=0;r<s.length;){const a=t[s.charAt(r++)],c=r<s.length?t[s.charAt(r)]:0;++r;const d=r<s.length?t[s.charAt(r)]:64;++r;const p=r<s.length?t[s.charAt(r)]:64;if(++r,a==null||c==null||d==null||p==null)throw new Nn;const x=a<<2|c>>4;if(n.push(x),d!==64){const I=c<<4&240|d>>2;if(n.push(I),p!==64){const j=d<<6&192|p;n.push(j)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let s=0;s<this.ENCODED_VALS.length;s++)this.byteToCharMap_[s]=this.ENCODED_VALS.charAt(s),this.charToByteMap_[this.byteToCharMap_[s]]=s,this.byteToCharMapWebSafe_[s]=this.ENCODED_VALS_WEBSAFE.charAt(s),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[s]]=s,s>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(s)]=s,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(s)]=s)}}};class Nn extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const En=function(s){const e=ms(s);return ps.encodeByteArray(e,!0)},gs=function(s){return En(s).replace(/\./g,"")},bs=function(s){try{return ps.decodeString(s,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Sn(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tn=()=>Sn().__FIREBASE_DEFAULTS__,Cn=()=>{if(typeof process>"u"||typeof Mt>"u")return;const s=Mt.__FIREBASE_DEFAULTS__;if(s)return JSON.parse(s)},An=()=>{if(typeof document>"u")return;let s;try{s=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=s&&bs(s[1]);return e&&JSON.parse(e)},lt=()=>{try{return In()||Tn()||Cn()||An()}catch(s){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${s}`);return}},Pn=s=>{var e,t;return(t=(e=lt())==null?void 0:e.emulatorHosts)==null?void 0:t[s]},xs=()=>{var s;return(s=lt())==null?void 0:s.config},ys=s=>{var e;return(e=lt())==null?void 0:e[`_${s}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jn{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function v(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Rn(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(v())}function On(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Dn(){const s=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof s=="object"&&s.id!==void 0}function Ln(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Mn(){const s=v();return s.indexOf("MSIE ")>=0||s.indexOf("Trident/")>=0}function Un(){try{return typeof indexedDB=="object"}catch{return!1}}function Fn(){return new Promise((s,e)=>{try{let t=!0;const n="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(n);r.onsuccess=()=>{r.result.close(),t||self.indexedDB.deleteDatabase(n),s(!0)},r.onupgradeneeded=()=>{t=!1},r.onerror=()=>{var a;e(((a=r.error)==null?void 0:a.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bn="FirebaseError";class q extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=Bn,Object.setPrototypeOf(this,q.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,ye.prototype.create)}}class ye{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},r=`${this.service}/${e}`,a=this.errors[e],o=a?Vn(a,n):"Error",c=`${this.serviceName}: ${o} (${r}).`;return new q(r,c,n)}}function Vn(s,e){return s.replace($n,(t,n)=>{const r=e[n];return r!=null?String(r):`<${n}?>`})}const $n=/\{\$([^}]+)}/g;function Hn(s){for(const e in s)if(Object.prototype.hasOwnProperty.call(s,e))return!1;return!0}function re(s,e){if(s===e)return!0;const t=Object.keys(s),n=Object.keys(e);for(const r of t){if(!n.includes(r))return!1;const a=s[r],o=e[r];if(Ut(a)&&Ut(o)){if(!re(a,o))return!1}else if(a!==o)return!1}for(const r of n)if(!t.includes(r))return!1;return!0}function Ut(s){return s!==null&&typeof s=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function we(s){const e=[];for(const[t,n]of Object.entries(s))Array.isArray(n)?n.forEach(r=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(r))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function zn(s,e){const t=new Wn(s,e);return t.subscribe.bind(t)}class Wn{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let r;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");qn(e,["next","error","complete"])?r=e:r={next:e,error:t,complete:n},r.next===void 0&&(r.next=Ke),r.error===void 0&&(r.error=Ke),r.complete===void 0&&(r.complete=Ke);const a=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?r.error(this.finalError):r.complete()}catch{}}),this.observers.push(r),a}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(n){typeof console<"u"&&console.error&&console.error(n)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function qn(s,e){if(typeof s!="object"||s===null)return!1;for(const t of e)if(t in s&&typeof s[t]=="function")return!0;return!1}function Ke(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oe(s){return s&&s._delegate?s._delegate:s}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dt(s){try{return(s.startsWith("http://")||s.startsWith("https://")?new URL(s).hostname:s).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Gn(s){return(await fetch(s,{credentials:"include"})).ok}class ie{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const K="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kn{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new jn;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:t});r&&n.resolve(r)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),n=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(r){if(n)return null;throw r}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Yn(e))try{this.getOrInitializeService({instanceIdentifier:K})}catch{}for(const[t,n]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(t);try{const a=this.getOrInitializeService({instanceIdentifier:r});n.resolve(a)}catch{}}}}clearInstance(e=K){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=K){return this.instances.has(e)}getOptions(e=K){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[a,o]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(a);n===c&&o.resolve(r)}return r}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),r=this.onInitCallbacks.get(n)??new Set;r.add(e),this.onInitCallbacks.set(n,r);const a=this.instances.get(n);return a&&e(a,n),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const r of n)try{r(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:Jn(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=K){return this.component?this.component.multipleInstances?e:K:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Jn(s){return s===K?void 0:s}function Yn(s){return s.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xn{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Kn(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var g;(function(s){s[s.DEBUG=0]="DEBUG",s[s.VERBOSE=1]="VERBOSE",s[s.INFO=2]="INFO",s[s.WARN=3]="WARN",s[s.ERROR=4]="ERROR",s[s.SILENT=5]="SILENT"})(g||(g={}));const Qn={debug:g.DEBUG,verbose:g.VERBOSE,info:g.INFO,warn:g.WARN,error:g.ERROR,silent:g.SILENT},Zn=g.INFO,er={[g.DEBUG]:"log",[g.VERBOSE]:"log",[g.INFO]:"info",[g.WARN]:"warn",[g.ERROR]:"error"},tr=(s,e,...t)=>{if(e<s.logLevel)return;const n=new Date().toISOString(),r=er[e];if(r)console[r](`[${n}]  ${s.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class ws{constructor(e){this.name=e,this._logLevel=Zn,this._logHandler=tr,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in g))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Qn[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,g.DEBUG,...e),this._logHandler(this,g.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,g.VERBOSE,...e),this._logHandler(this,g.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,g.INFO,...e),this._logHandler(this,g.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,g.WARN,...e),this._logHandler(this,g.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,g.ERROR,...e),this._logHandler(this,g.ERROR,...e)}}const sr=(s,e)=>e.some(t=>s instanceof t);let Ft,Bt;function nr(){return Ft||(Ft=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function rr(){return Bt||(Bt=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const vs=new WeakMap,tt=new WeakMap,_s=new WeakMap,Je=new WeakMap,ht=new WeakMap;function ir(s){const e=new Promise((t,n)=>{const r=()=>{s.removeEventListener("success",a),s.removeEventListener("error",o)},a=()=>{t(z(s.result)),r()},o=()=>{n(s.error),r()};s.addEventListener("success",a),s.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&vs.set(t,s)}).catch(()=>{}),ht.set(e,s),e}function ar(s){if(tt.has(s))return;const e=new Promise((t,n)=>{const r=()=>{s.removeEventListener("complete",a),s.removeEventListener("error",o),s.removeEventListener("abort",o)},a=()=>{t(),r()},o=()=>{n(s.error||new DOMException("AbortError","AbortError")),r()};s.addEventListener("complete",a),s.addEventListener("error",o),s.addEventListener("abort",o)});tt.set(s,e)}let st={get(s,e,t){if(s instanceof IDBTransaction){if(e==="done")return tt.get(s);if(e==="objectStoreNames")return s.objectStoreNames||_s.get(s);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return z(s[e])},set(s,e,t){return s[e]=t,!0},has(s,e){return s instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in s}};function or(s){st=s(st)}function cr(s){return s===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const n=s.call(Ye(this),e,...t);return _s.set(n,e.sort?e.sort():[e]),z(n)}:rr().includes(s)?function(...e){return s.apply(Ye(this),e),z(vs.get(this))}:function(...e){return z(s.apply(Ye(this),e))}}function lr(s){return typeof s=="function"?cr(s):(s instanceof IDBTransaction&&ar(s),sr(s,nr())?new Proxy(s,st):s)}function z(s){if(s instanceof IDBRequest)return ir(s);if(Je.has(s))return Je.get(s);const e=lr(s);return e!==s&&(Je.set(s,e),ht.set(e,s)),e}const Ye=s=>ht.get(s);function dr(s,e,{blocked:t,upgrade:n,blocking:r,terminated:a}={}){const o=indexedDB.open(s,e),c=z(o);return n&&o.addEventListener("upgradeneeded",l=>{n(z(o.result),l.oldVersion,l.newVersion,z(o.transaction),l)}),t&&o.addEventListener("blocked",l=>t(l.oldVersion,l.newVersion,l)),c.then(l=>{a&&l.addEventListener("close",()=>a()),r&&l.addEventListener("versionchange",d=>r(d.oldVersion,d.newVersion,d))}).catch(()=>{}),c}const hr=["get","getKey","getAll","getAllKeys","count"],ur=["put","add","delete","clear"],Xe=new Map;function Vt(s,e){if(!(s instanceof IDBDatabase&&!(e in s)&&typeof e=="string"))return;if(Xe.get(e))return Xe.get(e);const t=e.replace(/FromIndex$/,""),n=e!==t,r=ur.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(r||hr.includes(t)))return;const a=async function(o,...c){const l=this.transaction(o,r?"readwrite":"readonly");let d=l.store;return n&&(d=d.index(c.shift())),(await Promise.all([d[t](...c),r&&l.done]))[0]};return Xe.set(e,a),a}or(s=>({...s,get:(e,t,n)=>Vt(e,t)||s.get(e,t,n),has:(e,t)=>!!Vt(e,t)||s.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fr{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(mr(t)){const n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}}function mr(s){const e=s.getComponent();return(e==null?void 0:e.type)==="VERSION"}const nt="@firebase/app",$t="0.14.11";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const M=new ws("@firebase/app"),pr="@firebase/app-compat",gr="@firebase/analytics-compat",br="@firebase/analytics",xr="@firebase/app-check-compat",yr="@firebase/app-check",wr="@firebase/auth",vr="@firebase/auth-compat",_r="@firebase/database",Ir="@firebase/data-connect",kr="@firebase/database-compat",Nr="@firebase/functions",Er="@firebase/functions-compat",Sr="@firebase/installations",Tr="@firebase/installations-compat",Cr="@firebase/messaging",Ar="@firebase/messaging-compat",Pr="@firebase/performance",jr="@firebase/performance-compat",Rr="@firebase/remote-config",Or="@firebase/remote-config-compat",Dr="@firebase/storage",Lr="@firebase/storage-compat",Mr="@firebase/firestore",Ur="@firebase/ai",Fr="@firebase/firestore-compat",Br="firebase",Vr="12.12.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rt="[DEFAULT]",$r={[nt]:"fire-core",[pr]:"fire-core-compat",[br]:"fire-analytics",[gr]:"fire-analytics-compat",[yr]:"fire-app-check",[xr]:"fire-app-check-compat",[wr]:"fire-auth",[vr]:"fire-auth-compat",[_r]:"fire-rtdb",[Ir]:"fire-data-connect",[kr]:"fire-rtdb-compat",[Nr]:"fire-fn",[Er]:"fire-fn-compat",[Sr]:"fire-iid",[Tr]:"fire-iid-compat",[Cr]:"fire-fcm",[Ar]:"fire-fcm-compat",[Pr]:"fire-perf",[jr]:"fire-perf-compat",[Rr]:"fire-rc",[Or]:"fire-rc-compat",[Dr]:"fire-gcs",[Lr]:"fire-gcs-compat",[Mr]:"fire-fst",[Fr]:"fire-fst-compat",[Ur]:"fire-vertex","fire-js":"fire-js",[Br]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oe=new Map,Hr=new Map,it=new Map;function Ht(s,e){try{s.container.addComponent(e)}catch(t){M.debug(`Component ${e.name} failed to register with FirebaseApp ${s.name}`,t)}}function ge(s){const e=s.name;if(it.has(e))return M.debug(`There were multiple attempts to register component ${e}.`),!1;it.set(e,s);for(const t of Oe.values())Ht(t,s);for(const t of Hr.values())Ht(t,s);return!0}function Is(s,e){const t=s.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),s.container.getProvider(e)}function C(s){return s==null?!1:s.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zr={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},W=new ye("app","Firebase",zr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wr{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new ie("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw W.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ve=Vr;function ks(s,e={}){let t=s;typeof e!="object"&&(e={name:e});const n={name:rt,automaticDataCollectionEnabled:!0,...e},r=n.name;if(typeof r!="string"||!r)throw W.create("bad-app-name",{appName:String(r)});if(t||(t=xs()),!t)throw W.create("no-options");const a=Oe.get(r);if(a){if(re(t,a.options)&&re(n,a.config))return a;throw W.create("duplicate-app",{appName:r})}const o=new Xn(r);for(const l of it.values())o.addComponent(l);const c=new Wr(t,n,o);return Oe.set(r,c),c}function qr(s=rt){const e=Oe.get(s);if(!e&&s===rt&&xs())return ks();if(!e)throw W.create("no-app",{appName:s});return e}function ee(s,e,t){let n=$r[s]??s;t&&(n+=`-${t}`);const r=n.match(/\s|\//),a=e.match(/\s|\//);if(r||a){const o=[`Unable to register library "${n}" with version "${e}":`];r&&o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),r&&a&&o.push("and"),a&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),M.warn(o.join(" "));return}ge(new ie(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gr="firebase-heartbeat-database",Kr=1,be="firebase-heartbeat-store";let Qe=null;function Ns(){return Qe||(Qe=dr(Gr,Kr,{upgrade:(s,e)=>{switch(e){case 0:try{s.createObjectStore(be)}catch(t){console.warn(t)}}}}).catch(s=>{throw W.create("idb-open",{originalErrorMessage:s.message})})),Qe}async function Jr(s){try{const t=(await Ns()).transaction(be),n=await t.objectStore(be).get(Es(s));return await t.done,n}catch(e){if(e instanceof q)M.warn(e.message);else{const t=W.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});M.warn(t.message)}}}async function zt(s,e){try{const n=(await Ns()).transaction(be,"readwrite");await n.objectStore(be).put(e,Es(s)),await n.done}catch(t){if(t instanceof q)M.warn(t.message);else{const n=W.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});M.warn(n.message)}}}function Es(s){return`${s.name}!${s.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yr=1024,Xr=30;class Qr{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new ei(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){var e,t;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),a=Wt();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===a||this._heartbeatsCache.heartbeats.some(o=>o.date===a))return;if(this._heartbeatsCache.heartbeats.push({date:a,agent:r}),this._heartbeatsCache.heartbeats.length>Xr){const o=ti(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(n){M.warn(n)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Wt(),{heartbeatsToSend:n,unsentEntries:r}=Zr(this._heartbeatsCache.heartbeats),a=gs(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),a}catch(t){return M.warn(t),""}}}function Wt(){return new Date().toISOString().substring(0,10)}function Zr(s,e=Yr){const t=[];let n=s.slice();for(const r of s){const a=t.find(o=>o.agent===r.agent);if(a){if(a.dates.push(r.date),qt(t)>e){a.dates.pop();break}}else if(t.push({agent:r.agent,dates:[r.date]}),qt(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}class ei{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Un()?Fn().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Jr(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return zt(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return zt(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}}function qt(s){return gs(JSON.stringify({version:2,heartbeats:s})).length}function ti(s){if(s.length===0)return-1;let e=0,t=s[0].date;for(let n=1;n<s.length;n++)s[n].date<t&&(t=s[n].date,e=n);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function si(s){ge(new ie("platform-logger",e=>new fr(e),"PRIVATE")),ge(new ie("heartbeat",e=>new Qr(e),"PRIVATE")),ee(nt,$t,s),ee(nt,$t,"esm2020"),ee("fire-js","")}si("");function Ss(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const ni=Ss,Ts=new ye("auth","Firebase",Ss());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const De=new ws("@firebase/auth");function ri(s,...e){De.logLevel<=g.WARN&&De.warn(`Auth (${ve}): ${s}`,...e)}function Ae(s,...e){De.logLevel<=g.ERROR&&De.error(`Auth (${ve}): ${s}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function P(s,...e){throw ft(s,...e)}function E(s,...e){return ft(s,...e)}function ut(s,e,t){const n={...ni(),[e]:t};return new ye("auth","Firebase",n).create(e,{appName:s.name})}function Y(s){return ut(s,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function ii(s,e,t){const n=t;if(!(e instanceof n))throw n.name!==e.constructor.name&&P(s,"argument-error"),ut(s,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function ft(s,...e){if(typeof s!="string"){const t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=s.name),s._errorFactory.create(t,...n)}return Ts.create(s,...e)}function u(s,e,...t){if(!s)throw ft(e,...t)}function D(s){const e="INTERNAL ASSERTION FAILED: "+s;throw Ae(e),new Error(e)}function U(s,e){s||D(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function at(){var s;return typeof self<"u"&&((s=self.location)==null?void 0:s.href)||""}function ai(){return Gt()==="http:"||Gt()==="https:"}function Gt(){var s;return typeof self<"u"&&((s=self.location)==null?void 0:s.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oi(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(ai()||Dn()||"connection"in navigator)?navigator.onLine:!0}function ci(){if(typeof navigator>"u")return null;const s=navigator;return s.languages&&s.languages[0]||s.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _e{constructor(e,t){this.shortDelay=e,this.longDelay=t,U(t>e,"Short delay should be less than long delay!"),this.isMobile=Rn()||Ln()}get(){return oi()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mt(s,e){U(s.emulator,"Emulator should always be set here");const{url:t}=s.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cs{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;D("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;D("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;D("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const li={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const di=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],hi=new _e(3e4,6e4);function pt(s,e){return s.tenantId&&!e.tenantId?{...e,tenantId:s.tenantId}:e}async function ce(s,e,t,n,r={}){return As(s,r,async()=>{let a={},o={};n&&(e==="GET"?o=n:a={body:JSON.stringify(n)});const c=we({key:s.config.apiKey,...o}).slice(1),l=await s._getAdditionalHeaders();l["Content-Type"]="application/json",s.languageCode&&(l["X-Firebase-Locale"]=s.languageCode);const d={method:e,headers:l,...a};return On()||(d.referrerPolicy="no-referrer"),s.emulatorConfig&&dt(s.emulatorConfig.host)&&(d.credentials="include"),Cs.fetch()(await Ps(s,s.config.apiHost,t,c),d)})}async function As(s,e,t){s._canInitEmulator=!1;const n={...li,...e};try{const r=new fi(s),a=await Promise.race([t(),r.promise]);r.clearNetworkTimeout();const o=await a.json();if("needConfirmation"in o)throw Ce(s,"account-exists-with-different-credential",o);if(a.ok&&!("errorMessage"in o))return o;{const c=a.ok?o.errorMessage:o.error.message,[l,d]=c.split(" : ");if(l==="FEDERATED_USER_ID_ALREADY_LINKED")throw Ce(s,"credential-already-in-use",o);if(l==="EMAIL_EXISTS")throw Ce(s,"email-already-in-use",o);if(l==="USER_DISABLED")throw Ce(s,"user-disabled",o);const m=n[l]||l.toLowerCase().replace(/[_\s]+/g,"-");if(d)throw ut(s,m,d);P(s,m)}}catch(r){if(r instanceof q)throw r;P(s,"network-request-failed",{message:String(r)})}}async function ui(s,e,t,n,r={}){const a=await ce(s,e,t,n,r);return"mfaPendingCredential"in a&&P(s,"multi-factor-auth-required",{_serverResponse:a}),a}async function Ps(s,e,t,n){const r=`${e}${t}?${n}`,a=s,o=a.config.emulator?mt(s.config,r):`${s.config.apiScheme}://${r}`;return di.includes(t)&&(await a._persistenceManagerAvailable,a._getPersistenceType()==="COOKIE")?a._getPersistence()._getFinalTarget(o).toString():o}class fi{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(E(this.auth,"network-request-failed")),hi.get())})}}function Ce(s,e,t){const n={appName:s.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);const r=E(s,e,n);return r.customData._tokenResponse=t,r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function mi(s,e){return ce(s,"POST","/v1/accounts:delete",e)}async function Le(s,e){return ce(s,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function me(s){if(s)try{const e=new Date(Number(s));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function pi(s,e=!1){const t=oe(s),n=await t.getIdToken(e),r=gt(n);u(r&&r.exp&&r.auth_time&&r.iat,t.auth,"internal-error");const a=typeof r.firebase=="object"?r.firebase:void 0,o=a==null?void 0:a.sign_in_provider;return{claims:r,token:n,authTime:me(Ze(r.auth_time)),issuedAtTime:me(Ze(r.iat)),expirationTime:me(Ze(r.exp)),signInProvider:o||null,signInSecondFactor:(a==null?void 0:a.sign_in_second_factor)||null}}function Ze(s){return Number(s)*1e3}function gt(s){const[e,t,n]=s.split(".");if(e===void 0||t===void 0||n===void 0)return Ae("JWT malformed, contained fewer than 3 sections"),null;try{const r=bs(t);return r?JSON.parse(r):(Ae("Failed to decode base64 JWT payload"),null)}catch(r){return Ae("Caught error parsing JWT payload as JSON",r==null?void 0:r.toString()),null}}function Kt(s){const e=gt(s);return u(e,"internal-error"),u(typeof e.exp<"u","internal-error"),u(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function xe(s,e,t=!1){if(t)return e;try{return await e}catch(n){throw n instanceof q&&gi(n)&&s.auth.currentUser===s&&await s.auth.signOut(),n}}function gi({code:s}){return s==="auth/user-disabled"||s==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bi{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=me(this.lastLoginAt),this.creationTime=me(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Me(s){var p;const e=s.auth,t=await s.getIdToken(),n=await xe(s,Le(e,{idToken:t}));u(n==null?void 0:n.users.length,e,"internal-error");const r=n.users[0];s._notifyReloadListener(r);const a=(p=r.providerUserInfo)!=null&&p.length?js(r.providerUserInfo):[],o=yi(s.providerData,a),c=s.isAnonymous,l=!(s.email&&r.passwordHash)&&!(o!=null&&o.length),d=c?l:!1,m={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:o,metadata:new ot(r.createdAt,r.lastLoginAt),isAnonymous:d};Object.assign(s,m)}async function xi(s){const e=oe(s);await Me(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function yi(s,e){return[...s.filter(n=>!e.some(r=>r.providerId===n.providerId)),...e]}function js(s){return s.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function wi(s,e){const t=await As(s,{},async()=>{const n=we({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:r,apiKey:a}=s.config,o=await Ps(s,r,"/v1/token",`key=${a}`),c=await s._getAdditionalHeaders();c["Content-Type"]="application/x-www-form-urlencoded";const l={method:"POST",headers:c,body:n};return s.emulatorConfig&&dt(s.emulatorConfig.host)&&(l.credentials="include"),Cs.fetch()(o,l)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function vi(s,e){return ce(s,"POST","/v2/accounts:revokeToken",pt(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class te{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){u(e.idToken,"internal-error"),u(typeof e.idToken<"u","internal-error"),u(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Kt(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){u(e.length!==0,"internal-error");const t=Kt(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(u(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:r,expiresIn:a}=await wi(e,t);this.updateTokensAndExpiration(n,r,Number(a))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){const{refreshToken:n,accessToken:r,expirationTime:a}=t,o=new te;return n&&(u(typeof n=="string","internal-error",{appName:e}),o.refreshToken=n),r&&(u(typeof r=="string","internal-error",{appName:e}),o.accessToken=r),a&&(u(typeof a=="number","internal-error",{appName:e}),o.expirationTime=a),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new te,this.toJSON())}_performRefresh(){return D("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function B(s,e){u(typeof s=="string"||typeof s>"u","internal-error",{appName:e})}class N{constructor({uid:e,auth:t,stsTokenManager:n,...r}){this.providerId="firebase",this.proactiveRefresh=new bi(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new ot(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){const t=await xe(this,this.stsTokenManager.getToken(this.auth,e));return u(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return pi(this,e)}reload(){return xi(this)}_assign(e){this!==e&&(u(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new N({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){u(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await Me(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(C(this.auth.app))return Promise.reject(Y(this.auth));const e=await this.getIdToken();return await xe(this,mi(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const n=t.displayName??void 0,r=t.email??void 0,a=t.phoneNumber??void 0,o=t.photoURL??void 0,c=t.tenantId??void 0,l=t._redirectEventId??void 0,d=t.createdAt??void 0,m=t.lastLoginAt??void 0,{uid:p,emailVerified:x,isAnonymous:I,providerData:j,stsTokenManager:ke}=t;u(p&&ke,e,"internal-error");const ze=te.fromJSON(this.name,ke);u(typeof p=="string",e,"internal-error"),B(n,e.name),B(r,e.name),u(typeof x=="boolean",e,"internal-error"),u(typeof I=="boolean",e,"internal-error"),B(a,e.name),B(o,e.name),B(c,e.name),B(l,e.name),B(d,e.name),B(m,e.name);const de=new N({uid:p,auth:e,email:r,emailVerified:x,displayName:n,isAnonymous:I,photoURL:o,phoneNumber:a,tenantId:c,stsTokenManager:ze,createdAt:d,lastLoginAt:m});return j&&Array.isArray(j)&&(de.providerData=j.map(We=>({...We}))),l&&(de._redirectEventId=l),de}static async _fromIdTokenResponse(e,t,n=!1){const r=new te;r.updateFromServerResponse(t);const a=new N({uid:t.localId,auth:e,stsTokenManager:r,isAnonymous:n});return await Me(a),a}static async _fromGetAccountInfoResponse(e,t,n){const r=t.users[0];u(r.localId!==void 0,"internal-error");const a=r.providerUserInfo!==void 0?js(r.providerUserInfo):[],o=!(r.email&&r.passwordHash)&&!(a!=null&&a.length),c=new te;c.updateFromIdToken(n);const l=new N({uid:r.localId,auth:e,stsTokenManager:c,isAnonymous:o}),d={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new ot(r.createdAt,r.lastLoginAt),isAnonymous:!(r.email&&r.passwordHash)&&!(a!=null&&a.length)};return Object.assign(l,d),l}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jt=new Map;function L(s){U(s instanceof Function,"Expected a class definition");let e=Jt.get(s);return e?(U(e instanceof s,"Instance stored in cache mismatched with class"),e):(e=new s,Jt.set(s,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rs{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}Rs.type="NONE";const Yt=Rs;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pe(s,e,t){return`firebase:${s}:${e}:${t}`}class se{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:r,name:a}=this.auth;this.fullUserKey=Pe(this.userKey,r.apiKey,a),this.fullPersistenceKey=Pe("persistence",r.apiKey,a),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Le(this.auth,{idToken:e}).catch(()=>{});return t?N._fromGetAccountInfoResponse(this.auth,t,e):null}return N._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,n="authUser"){if(!t.length)return new se(L(Yt),e,n);const r=(await Promise.all(t.map(async d=>{if(await d._isAvailable())return d}))).filter(d=>d);let a=r[0]||L(Yt);const o=Pe(n,e.config.apiKey,e.name);let c=null;for(const d of t)try{const m=await d._get(o);if(m){let p;if(typeof m=="string"){const x=await Le(e,{idToken:m}).catch(()=>{});if(!x)break;p=await N._fromGetAccountInfoResponse(e,x,m)}else p=N._fromJSON(e,m);d!==a&&(c=p),a=d;break}}catch{}const l=r.filter(d=>d._shouldAllowMigration);return!a._shouldAllowMigration||!l.length?new se(a,e,n):(a=l[0],c&&await a._set(o,c.toJSON()),await Promise.all(t.map(async d=>{if(d!==a)try{await d._remove(o)}catch{}})),new se(a,e,n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xt(s){const e=s.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(Ms(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(Os(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(Fs(e))return"Blackberry";if(Bs(e))return"Webos";if(Ds(e))return"Safari";if((e.includes("chrome/")||Ls(e))&&!e.includes("edge/"))return"Chrome";if(Us(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=s.match(t);if((n==null?void 0:n.length)===2)return n[1]}return"Other"}function Os(s=v()){return/firefox\//i.test(s)}function Ds(s=v()){const e=s.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function Ls(s=v()){return/crios\//i.test(s)}function Ms(s=v()){return/iemobile/i.test(s)}function Us(s=v()){return/android/i.test(s)}function Fs(s=v()){return/blackberry/i.test(s)}function Bs(s=v()){return/webos/i.test(s)}function bt(s=v()){return/iphone|ipad|ipod/i.test(s)||/macintosh/i.test(s)&&/mobile/i.test(s)}function _i(s=v()){var e;return bt(s)&&!!((e=window.navigator)!=null&&e.standalone)}function Ii(){return Mn()&&document.documentMode===10}function Vs(s=v()){return bt(s)||Us(s)||Bs(s)||Fs(s)||/windows phone/i.test(s)||Ms(s)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $s(s,e=[]){let t;switch(s){case"Browser":t=Xt(v());break;case"Worker":t=`${Xt(v())}-${s}`;break;default:t=s}const n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${ve}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ki{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const n=a=>new Promise((o,c)=>{try{const l=e(a);o(l)}catch(l){c(l)}});n.onAbort=t,this.queue.push(n);const r=this.queue.length-1;return()=>{this.queue[r]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(const r of t)try{r()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n==null?void 0:n.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ni(s,e={}){return ce(s,"GET","/v2/passwordPolicy",pt(s,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ei=6;class Si{constructor(e){var n;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??Ei,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((n=e.allowedNonAlphanumericCharacters)==null?void 0:n.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,r=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),r&&(t.meetsMaxPasswordLength=e.length<=r)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let r=0;r<e.length;r++)n=e.charAt(r),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,r,a){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=r)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=a))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ti{constructor(e,t,n,r){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=r,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Qt(this),this.idTokenSubscription=new Qt(this),this.beforeStateQueue=new ki(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=Ts,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=r.sdkClientVersion,this._persistenceManagerAvailable=new Promise(a=>this._resolvePersistenceManagerAvailable=a)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=L(t)),this._initializationPromise=this.queue(async()=>{var n,r,a;if(!this._deleted&&(this.persistenceManager=await se.create(this,e),(n=this._resolvePersistenceManagerAvailable)==null||n.call(this),!this._deleted)){if((r=this._popupRedirectResolver)!=null&&r._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((a=this.currentUser)==null?void 0:a.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Le(this,{idToken:e}),n=await N._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var a;if(C(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(c=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(c,c))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let n=t,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(a=this.redirectUser)==null?void 0:a._redirectEventId,c=n==null?void 0:n._redirectEventId,l=await this.tryRedirectSignIn(e);(!o||o===c)&&(l!=null&&l.user)&&(n=l.user,r=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(n)}catch(o){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return u(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Me(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=ci()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(C(this.app))return Promise.reject(Y(this));const t=e?oe(e):null;return t&&u(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&u(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return C(this.app)?Promise.reject(Y(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return C(this.app)?Promise.reject(Y(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(L(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await Ni(this),t=new Si(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new ye("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await vi(this,n)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&L(e)||this._popupRedirectResolver;u(t,this,"argument-error"),this.redirectPersistenceManager=await se.create(this,[L(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,n;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((n=this.redirectUser)==null?void 0:n._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,r){if(this._deleted)return()=>{};const a=typeof t=="function"?t:t.next.bind(t);let o=!1;const c=this._isInitialized?Promise.resolve():this._initializationPromise;if(u(c,this,"internal-error"),c.then(()=>{o||a(this.currentUser)}),typeof t=="function"){const l=e.addObserver(t,n,r);return()=>{o=!0,l()}}else{const l=e.addObserver(t);return()=>{o=!0,l()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return u(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=$s(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var r;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((r=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:r.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){var t;if(C(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&ri(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function Ve(s){return oe(s)}class Qt{constructor(e){this.auth=e,this.observer=null,this.addObserver=zn(t=>this.observer=t)}get next(){return u(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let xt={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function Ci(s){xt=s}function Ai(s){return xt.loadJS(s)}function Pi(){return xt.gapiScript}function ji(s){return`__${s}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ri(s,e){const t=Is(s,"auth");if(t.isInitialized()){const r=t.getImmediate(),a=t.getOptions();if(re(a,e??{}))return r;P(r,"already-initialized")}return t.initialize({options:e})}function Oi(s,e){const t=(e==null?void 0:e.persistence)||[],n=(Array.isArray(t)?t:[t]).map(L);e!=null&&e.errorMap&&s._updateErrorMap(e.errorMap),s._initializeWithPersistence(n,e==null?void 0:e.popupRedirectResolver)}function Di(s,e,t){const n=Ve(s);u(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");const r=!1,a=Hs(e),{host:o,port:c}=Li(e),l=c===null?"":`:${c}`,d={url:`${a}//${o}${l}/`},m=Object.freeze({host:o,port:c,protocol:a.replace(":",""),options:Object.freeze({disableWarnings:r})});if(!n._canInitEmulator){u(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),u(re(d,n.config.emulator)&&re(m,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=d,n.emulatorConfig=m,n.settings.appVerificationDisabledForTesting=!0,dt(o)?Gn(`${a}//${o}${l}`):Mi()}function Hs(s){const e=s.indexOf(":");return e<0?"":s.substr(0,e+1)}function Li(s){const e=Hs(s),t=/(\/\/)?([^?#/]+)/.exec(s.substr(e.length));if(!t)return{host:"",port:null};const n=t[2].split("@").pop()||"",r=/^(\[[^\]]+\])(:|$)/.exec(n);if(r){const a=r[1];return{host:a,port:Zt(n.substr(a.length+1))}}else{const[a,o]=n.split(":");return{host:a,port:Zt(o)}}}function Zt(s){if(!s)return null;const e=Number(s);return isNaN(e)?null:e}function Mi(){function s(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",s):s())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zs{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return D("not implemented")}_getIdTokenResponse(e){return D("not implemented")}_linkToIdToken(e,t){return D("not implemented")}_getReauthenticationResolver(e){return D("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ne(s,e){return ui(s,"POST","/v1/accounts:signInWithIdp",pt(s,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ui="http://localhost";class F extends zs{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new F(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):P("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:r,...a}=t;if(!n||!r)return null;const o=new F(n,r);return o.idToken=a.idToken||void 0,o.accessToken=a.accessToken||void 0,o.secret=a.secret,o.nonce=a.nonce,o.pendingToken=a.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return ne(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,ne(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,ne(e,t)}buildRequest(){const e={requestUri:Ui,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=we(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yt{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class le extends yt{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}class pe extends le{static credentialFromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;return u("providerId"in t&&"signInMethod"in t,"argument-error"),F._fromParams(t)}credential(e){return this._credential({...e,nonce:e.rawNonce})}_credential(e){return u(e.idToken||e.accessToken,"argument-error"),F._fromParams({...e,providerId:this.providerId,signInMethod:this.providerId})}static credentialFromResult(e){return pe.oauthCredentialFromTaggedObject(e)}static credentialFromError(e){return pe.oauthCredentialFromTaggedObject(e.customData||{})}static oauthCredentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n,oauthTokenSecret:r,pendingToken:a,nonce:o,providerId:c}=e;if(!n&&!r&&!t&&!a||!c)return null;try{return new pe(c)._credential({idToken:t,accessToken:n,nonce:o,pendingToken:a})}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class V extends le{constructor(){super("facebook.com")}static credential(e){return F._fromParams({providerId:V.PROVIDER_ID,signInMethod:V.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return V.credentialFromTaggedObject(e)}static credentialFromError(e){return V.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return V.credential(e.oauthAccessToken)}catch{return null}}}V.FACEBOOK_SIGN_IN_METHOD="facebook.com";V.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class O extends le{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return F._fromParams({providerId:O.PROVIDER_ID,signInMethod:O.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return O.credentialFromTaggedObject(e)}static credentialFromError(e){return O.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return O.credential(t,n)}catch{return null}}}O.GOOGLE_SIGN_IN_METHOD="google.com";O.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $ extends le{constructor(){super("github.com")}static credential(e){return F._fromParams({providerId:$.PROVIDER_ID,signInMethod:$.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return $.credentialFromTaggedObject(e)}static credentialFromError(e){return $.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return $.credential(e.oauthAccessToken)}catch{return null}}}$.GITHUB_SIGN_IN_METHOD="github.com";$.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class H extends le{constructor(){super("twitter.com")}static credential(e,t){return F._fromParams({providerId:H.PROVIDER_ID,signInMethod:H.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return H.credentialFromTaggedObject(e)}static credentialFromError(e){return H.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return H.credential(t,n)}catch{return null}}}H.TWITTER_SIGN_IN_METHOD="twitter.com";H.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ae{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,r=!1){const a=await N._fromIdTokenResponse(e,n,r),o=es(n);return new ae({user:a,providerId:o,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const r=es(n);return new ae({user:e,providerId:r,_tokenResponse:n,operationType:t})}}function es(s){return s.providerId?s.providerId:"phoneNumber"in s?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ue extends q{constructor(e,t,n,r){super(t.code,t.message),this.operationType=n,this.user=r,Object.setPrototypeOf(this,Ue.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,r){return new Ue(e,t,n,r)}}function Ws(s,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(s):t._getIdTokenResponse(s)).catch(a=>{throw a.code==="auth/multi-factor-auth-required"?Ue._fromErrorAndOperation(s,a,e,n):a})}async function Fi(s,e,t=!1){const n=await xe(s,e._linkToIdToken(s.auth,await s.getIdToken()),t);return ae._forOperation(s,"link",n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Bi(s,e,t=!1){const{auth:n}=s;if(C(n.app))return Promise.reject(Y(n));const r="reauthenticate";try{const a=await xe(s,Ws(n,r,e,s),t);u(a.idToken,n,"internal-error");const o=gt(a.idToken);u(o,n,"internal-error");const{sub:c}=o;return u(s.uid===c,n,"user-mismatch"),ae._forOperation(s,r,a)}catch(a){throw(a==null?void 0:a.code)==="auth/user-not-found"&&P(n,"user-mismatch"),a}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Vi(s,e,t=!1){if(C(s.app))return Promise.reject(Y(s));const n="signIn",r=await Ws(s,n,e),a=await ae._fromIdTokenResponse(s,n,r);return t||await s._updateCurrentUser(a.user),a}function $i(s,e,t,n){return oe(s).onIdTokenChanged(e,t,n)}function Hi(s,e,t){return oe(s).beforeAuthStateChanged(e,t)}const Fe="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qs{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Fe,"1"),this.storage.removeItem(Fe),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zi=1e3,Wi=10;class Gs extends qs{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Vs(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),r=this.localCache[t];n!==r&&e(t,r,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,c,l)=>{this.notifyListeners(o,l)});return}const n=e.key;t?this.detachListener():this.stopPolling();const r=()=>{const o=this.storage.getItem(n);!t&&this.localCache[n]===o||this.notifyListeners(n,o)},a=this.storage.getItem(n);Ii()&&a!==e.newValue&&e.newValue!==e.oldValue?setTimeout(r,Wi):r()}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const r of Array.from(n))r(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},zi)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Gs.type="LOCAL";const qi=Gs;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ks extends qs{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Ks.type="SESSION";const Js=Ks;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gi(s){return Promise.all(s.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $e{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(r=>r.isListeningto(e));if(t)return t;const n=new $e(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:r,data:a}=t.data,o=this.handlersMap[r];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:r});const c=Array.from(o).map(async d=>d(t.origin,a)),l=await Gi(c);t.ports[0].postMessage({status:"done",eventId:n,eventType:r,response:l})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}$e.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wt(s="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return s+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ki{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const r=typeof MessageChannel<"u"?new MessageChannel:null;if(!r)throw new Error("connection_unavailable");let a,o;return new Promise((c,l)=>{const d=wt("",20);r.port1.start();const m=setTimeout(()=>{l(new Error("unsupported_event"))},n);o={messageChannel:r,onMessage(p){const x=p;if(x.data.eventId===d)switch(x.data.status){case"ack":clearTimeout(m),a=setTimeout(()=>{l(new Error("timeout"))},3e3);break;case"done":clearTimeout(a),c(x.data.response);break;default:clearTimeout(m),clearTimeout(a),l(new Error("invalid_response"));break}}},this.handlers.add(o),r.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:d,data:t},[r.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function A(){return window}function Ji(s){A().location.href=s}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ys(){return typeof A().WorkerGlobalScope<"u"&&typeof A().importScripts=="function"}async function Yi(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Xi(){var s;return((s=navigator==null?void 0:navigator.serviceWorker)==null?void 0:s.controller)||null}function Qi(){return Ys()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xs="firebaseLocalStorageDb",Zi=1,Be="firebaseLocalStorage",Qs="fbase_key";class Ie{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function He(s,e){return s.transaction([Be],e?"readwrite":"readonly").objectStore(Be)}function ea(){const s=indexedDB.deleteDatabase(Xs);return new Ie(s).toPromise()}function ct(){const s=indexedDB.open(Xs,Zi);return new Promise((e,t)=>{s.addEventListener("error",()=>{t(s.error)}),s.addEventListener("upgradeneeded",()=>{const n=s.result;try{n.createObjectStore(Be,{keyPath:Qs})}catch(r){t(r)}}),s.addEventListener("success",async()=>{const n=s.result;n.objectStoreNames.contains(Be)?e(n):(n.close(),await ea(),e(await ct()))})})}async function ts(s,e,t){const n=He(s,!0).put({[Qs]:e,value:t});return new Ie(n).toPromise()}async function ta(s,e){const t=He(s,!1).get(e),n=await new Ie(t).toPromise();return n===void 0?null:n.value}function ss(s,e){const t=He(s,!0).delete(e);return new Ie(t).toPromise()}const sa=800,na=3;class Zs{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await ct(),this.db)}async _withRetries(e){let t=0;for(;;)try{const n=await this._openDb();return await e(n)}catch(n){if(t++>na)throw n;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return Ys()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=$e._getInstance(Qi()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,n;if(this.activeServiceWorker=await Yi(),!this.activeServiceWorker)return;this.sender=new Ki(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(n=e[0])!=null&&n.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Xi()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await ct();return await ts(e,Fe,"1"),await ss(e,Fe),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>ts(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(n=>ta(n,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>ss(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(r=>{const a=He(r,!1).getAll();return new Ie(a).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],n=new Set;if(e.length!==0)for(const{fbase_key:r,value:a}of e)n.add(r),JSON.stringify(this.localCache[r])!==JSON.stringify(a)&&(this.notifyListeners(r,a),t.push(r));for(const r of Object.keys(this.localCache))this.localCache[r]&&!n.has(r)&&(this.notifyListeners(r,null),t.push(r));return t}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const r of Array.from(n))r(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),sa)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}Zs.type="LOCAL";const ra=Zs;new _e(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function en(s,e){return e?L(e):(u(s._popupRedirectResolver,s,"argument-error"),s._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vt extends zs{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return ne(e,this._buildIdpRequest())}_linkToIdToken(e,t){return ne(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return ne(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function ia(s){return Vi(s.auth,new vt(s),s.bypassAuthState)}function aa(s){const{auth:e,user:t}=s;return u(t,e,"internal-error"),Bi(t,new vt(s),s.bypassAuthState)}async function oa(s){const{auth:e,user:t}=s;return u(t,e,"internal-error"),Fi(t,new vt(s),s.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tn{constructor(e,t,n,r,a=!1){this.auth=e,this.resolver=n,this.user=r,this.bypassAuthState=a,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(n){this.reject(n)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:n,postBody:r,tenantId:a,error:o,type:c}=e;if(o){this.reject(o);return}const l={auth:this.auth,requestUri:t,sessionId:n,tenantId:a||void 0,postBody:r||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(c)(l))}catch(d){this.reject(d)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return ia;case"linkViaPopup":case"linkViaRedirect":return oa;case"reauthViaPopup":case"reauthViaRedirect":return aa;default:P(this.auth,"internal-error")}}resolve(e){U(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){U(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ca=new _e(2e3,1e4);async function la(s,e,t){if(C(s.app))return Promise.reject(E(s,"operation-not-supported-in-this-environment"));const n=Ve(s);ii(s,e,yt);const r=en(n,t);return new J(n,"signInViaPopup",e,r).executeNotNull()}class J extends tn{constructor(e,t,n,r,a){super(e,t,r,a),this.provider=n,this.authWindow=null,this.pollId=null,J.currentPopupAction&&J.currentPopupAction.cancel(),J.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return u(e,this.auth,"internal-error"),e}async onExecution(){U(this.filter.length===1,"Popup operations only handle one event");const e=wt();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(E(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(E(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,J.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,n;if((n=(t=this.authWindow)==null?void 0:t.window)!=null&&n.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(E(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,ca.get())};e()}}J.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const da="pendingRedirect",je=new Map;class ha extends tn{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=je.get(this.auth._key());if(!e){try{const n=await ua(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}je.set(this.auth._key(),e)}return this.bypassAuthState||je.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function ua(s,e){const t=pa(e),n=ma(s);if(!await n._isAvailable())return!1;const r=await n._get(t)==="true";return await n._remove(t),r}function fa(s,e){je.set(s._key(),e)}function ma(s){return L(s._redirectPersistence)}function pa(s){return Pe(da,s.config.apiKey,s.name)}async function ga(s,e,t=!1){if(C(s.app))return Promise.reject(Y(s));const n=Ve(s),r=en(n,e),o=await new ha(n,r,t).execute();return o&&!t&&(delete o.user._redirectEventId,await n._persistUserIfCurrent(o.user),await n._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ba=600*1e3;class xa{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!ya(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var n;if(e.error&&!sn(e)){const r=((n=e.error.code)==null?void 0:n.split("auth/")[1])||"internal-error";t.onError(E(this.auth,r))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=ba&&this.cachedEventUids.clear(),this.cachedEventUids.has(ns(e))}saveEventToCache(e){this.cachedEventUids.add(ns(e)),this.lastProcessedEventTime=Date.now()}}function ns(s){return[s.type,s.eventId,s.sessionId,s.tenantId].filter(e=>e).join("-")}function sn({type:s,error:e}){return s==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function ya(s){switch(s.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return sn(s);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function wa(s,e={}){return ce(s,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const va=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,_a=/^https?/;async function Ia(s){if(s.config.emulator)return;const{authorizedDomains:e}=await wa(s);for(const t of e)try{if(ka(t))return}catch{}P(s,"unauthorized-domain")}function ka(s){const e=at(),{protocol:t,hostname:n}=new URL(e);if(s.startsWith("chrome-extension://")){const o=new URL(s);return o.hostname===""&&n===""?t==="chrome-extension:"&&s.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===n}if(!_a.test(t))return!1;if(va.test(s))return n===s;const r=s.replace(/\./g,"\\.");return new RegExp("^(.+\\."+r+"|"+r+")$","i").test(n)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Na=new _e(3e4,6e4);function rs(){const s=A().___jsl;if(s!=null&&s.H){for(const e of Object.keys(s.H))if(s.H[e].r=s.H[e].r||[],s.H[e].L=s.H[e].L||[],s.H[e].r=[...s.H[e].L],s.CP)for(let t=0;t<s.CP.length;t++)s.CP[t]=null}}function Ea(s){return new Promise((e,t)=>{var r,a,o;function n(){rs(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{rs(),t(E(s,"network-request-failed"))},timeout:Na.get()})}if((a=(r=A().gapi)==null?void 0:r.iframes)!=null&&a.Iframe)e(gapi.iframes.getContext());else if((o=A().gapi)!=null&&o.load)n();else{const c=ji("iframefcb");return A()[c]=()=>{gapi.load?n():t(E(s,"network-request-failed"))},Ai(`${Pi()}?onload=${c}`).catch(l=>t(l))}}).catch(e=>{throw Re=null,e})}let Re=null;function Sa(s){return Re=Re||Ea(s),Re}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ta=new _e(5e3,15e3),Ca="__/auth/iframe",Aa="emulator/auth/iframe",Pa={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},ja=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Ra(s){const e=s.config;u(e.authDomain,s,"auth-domain-config-required");const t=e.emulator?mt(e,Aa):`https://${s.config.authDomain}/${Ca}`,n={apiKey:e.apiKey,appName:s.name,v:ve},r=ja.get(s.config.apiHost);r&&(n.eid=r);const a=s._getFrameworks();return a.length&&(n.fw=a.join(",")),`${t}?${we(n).slice(1)}`}async function Oa(s){const e=await Sa(s),t=A().gapi;return u(t,s,"internal-error"),e.open({where:document.body,url:Ra(s),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Pa,dontclear:!0},n=>new Promise(async(r,a)=>{await n.restyle({setHideOnLeave:!1});const o=E(s,"network-request-failed"),c=A().setTimeout(()=>{a(o)},Ta.get());function l(){A().clearTimeout(c),r(n)}n.ping(l).then(l,()=>{a(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Da={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},La=500,Ma=600,Ua="_blank",Fa="http://localhost";class is{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Ba(s,e,t,n=La,r=Ma){const a=Math.max((window.screen.availHeight-r)/2,0).toString(),o=Math.max((window.screen.availWidth-n)/2,0).toString();let c="";const l={...Da,width:n.toString(),height:r.toString(),top:a,left:o},d=v().toLowerCase();t&&(c=Ls(d)?Ua:t),Os(d)&&(e=e||Fa,l.scrollbars="yes");const m=Object.entries(l).reduce((x,[I,j])=>`${x}${I}=${j},`,"");if(_i(d)&&c!=="_self")return Va(e||"",c),new is(null);const p=window.open(e||"",c,m);u(p,s,"popup-blocked");try{p.focus()}catch{}return new is(p)}function Va(s,e){const t=document.createElement("a");t.href=s,t.target=e;const n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $a="__/auth/handler",Ha="emulator/auth/handler",za=encodeURIComponent("fac");async function as(s,e,t,n,r,a){u(s.config.authDomain,s,"auth-domain-config-required"),u(s.config.apiKey,s,"invalid-api-key");const o={apiKey:s.config.apiKey,appName:s.name,authType:t,redirectUrl:n,v:ve,eventId:r};if(e instanceof yt){e.setDefaultLanguage(s.languageCode),o.providerId=e.providerId||"",Hn(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[m,p]of Object.entries({}))o[m]=p}if(e instanceof le){const m=e.getScopes().filter(p=>p!=="");m.length>0&&(o.scopes=m.join(","))}s.tenantId&&(o.tid=s.tenantId);const c=o;for(const m of Object.keys(c))c[m]===void 0&&delete c[m];const l=await s._getAppCheckToken(),d=l?`#${za}=${encodeURIComponent(l)}`:"";return`${Wa(s)}?${we(c).slice(1)}${d}`}function Wa({config:s}){return s.emulator?mt(s,Ha):`https://${s.authDomain}/${$a}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const et="webStorageSupport";class qa{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Js,this._completeRedirectFn=ga,this._overrideRedirectResult=fa}async _openPopup(e,t,n,r){var o;U((o=this.eventManagers[e._key()])==null?void 0:o.manager,"_initialize() not called before _openPopup()");const a=await as(e,t,n,at(),r);return Ba(e,a,wt())}async _openRedirect(e,t,n,r){await this._originValidation(e);const a=await as(e,t,n,at(),r);return Ji(a),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:r,promise:a}=this.eventManagers[t];return r?Promise.resolve(r):(U(a,"If manager is not set, promise should be"),a)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await Oa(e),n=new xa(e);return t.register("authEvent",r=>(u(r==null?void 0:r.authEvent,e,"invalid-auth-event"),{status:n.onEvent(r.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(et,{type:et},r=>{var o;const a=(o=r==null?void 0:r[0])==null?void 0:o[et];a!==void 0&&t(!!a),P(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=Ia(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Vs()||Ds()||bt()}}const Ga=qa;var os="@firebase/auth",cs="1.13.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ka{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(n=>{e((n==null?void 0:n.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){u(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ja(s){switch(s){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function Ya(s){ge(new ie("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),r=e.getProvider("heartbeat"),a=e.getProvider("app-check-internal"),{apiKey:o,authDomain:c}=n.options;u(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});const l={apiKey:o,authDomain:c,clientPlatform:s,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:$s(s)},d=new Ti(n,r,a,l);return Oi(d,t),d},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),ge(new ie("auth-internal",e=>{const t=Ve(e.getProvider("auth").getImmediate());return(n=>new Ka(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),ee(os,cs,Ja(s)),ee(os,cs,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xa=300,Qa=ys("authIdTokenMaxAge")||Xa;let ls=null;const Za=s=>async e=>{const t=e&&await e.getIdTokenResult(),n=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>Qa)return;const r=t==null?void 0:t.token;ls!==r&&(ls=r,await fetch(s,{method:r?"POST":"DELETE",headers:r?{Authorization:`Bearer ${r}`}:{}}))};function eo(s=qr()){const e=Is(s,"auth");if(e.isInitialized())return e.getImmediate();const t=Ri(s,{popupRedirectResolver:Ga,persistence:[ra,qi,Js]}),n=ys("authTokenSyncURL");if(n&&typeof isSecureContext=="boolean"&&isSecureContext){const a=new URL(n,location.origin);if(location.origin===a.origin){const o=Za(a.toString());Hi(t,o,()=>o(t.currentUser)),$i(t,c=>o(c))}}const r=Pn("auth");return r&&Di(t,`http://${r}`),t}function to(){var s;return((s=document.getElementsByTagName("head"))==null?void 0:s[0])??document}Ci({loadJS(s){return new Promise((e,t)=>{const n=document.createElement("script");n.setAttribute("src",s),n.onload=e,n.onerror=r=>{const a=E("internal-error");a.customData=r,t(a)},n.type="text/javascript",n.charset="UTF-8",to().appendChild(n)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});Ya("Browser");var so="firebase",no="12.12.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ee(so,no,"app");const nn={apiKey:void 0,authDomain:void 0,projectId:void 0,storageBucket:void 0,messagingSenderId:void 0,appId:void 0},ro=Object.values(nn).every(s=>typeof s!="string"||!s.trim()?!1:!/^(MY_|YOUR_|your-)/i.test(s.trim())),ds=ro?ks(nn):null,hs=ds?eo(ds):null,us=new O,fs=new pe("apple.com");function wo(){var Tt;const[s,e]=k.useState("hero"),t=fn(),n=(Tt=new URLSearchParams(window.location.search).get("ref"))==null?void 0:Tt.trim(),[r,a]=k.useState(!1),[o,c]=k.useState(""),[l,d]=k.useState(""),[m,p]=k.useState(""),x=G(T.users.createUser),I=Rt(T.actions.sendVerificationEmail),j=Rt(T.actions.sendPasswordResetEmail),ke=G(T.users.verifyUser),ze=G(T.users.login),de=G(T.users.socialLogin),We=G(T.users.requestVerificationEmail),rn=G(T.users.requestPasswordReset),an=G(T.users.resetPassword),[y,Ne]=k.useState({name:"",email:"",phone:"",password:""}),[_t,It]=k.useState(""),[qe,kt]=k.useState(""),[Ee,Nt]=k.useState(""),[Et,St]=k.useState(""),he=mn(T.users.validatePasswordResetToken,qe?{token:qe}:"skip");k.useEffect(()=>{var Ct,At,Pt,jt;const f=new URLSearchParams(window.location.search),h=f.get("token"),w=(Ct=f.get("reset"))==null?void 0:Ct.trim(),_=(At=f.get("ref"))==null?void 0:At.trim(),S=(Pt=f.get("verification"))==null?void 0:Pt.trim(),Ge=(jt=f.get("email"))==null?void 0:jt.trim(),Q=ue.getCurrentUser();if(w)kt(w),e("reset");else if(S==="expired"&&Ge||ue.hasExpiredVerification(Q)){const R=Ge||(Q==null?void 0:Q.email)||"";ue.clearSession(),p(R),Ne(Z=>({...Z,email:R})),c("Your verification window expired. Send a fresh verification email to continue."),e("login"),window.history.replaceState({},document.title,window.location.pathname)}else f.get("verified")==="true"||h?(window.history.replaceState({},document.title,window.location.pathname),h?(a(!0),ke({token:h}).then(R=>{if(R.success)d(R.alreadyVerified?"Your account is already verified. Please log in.":"Account verified successfully! You can now log in.");else{c(R.message??"Verification failed. Please try again.");const Z=R;Z.error==="token_expired"&&Z.email&&(p(Z.email),Ne(un=>({...un,email:Z.email})))}e("login")}).catch(R=>{c("Verification failed. The link may be invalid or already used."),e("login"),console.error("[verifyUser] Unexpected error:",R)}).finally(()=>a(!1))):(d("Account verified successfully! You can now log in."),e("login"))):_&&e("signup")},[]);const X=f=>{Ne({...y,[f.target.name]:f.target.value})},on=async f=>{f.preventDefault(),a(!0),c(""),d("");try{const h=y.email.trim().toLowerCase(),w=y.phone.trim();if(!h&&!w)throw new Error("Enter an email address or phone number");const _=h?Math.random().toString(36).substring(2)+Date.now().toString(36):void 0,S=h?new Date(Date.now()+1440*60*1e3).toISOString():void 0,Q=`${(y.name||h.split("@")[0]||w.slice(-6)).toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20)||"user"}${Math.floor(100+Math.random()*900)}`;await x({email:h||void 0,full_name:y.name,username:Q,phone:w||void 0,password_hash:y.password,verification_token:_,verification_token_expires:S,referred_by_code:(n==null?void 0:n.toUpperCase())||void 0}),h&&_&&await I({email:h,name:y.name,token:_,baseUrl:window.location.origin}),d(h?"Account created! Please check your email to verify.":"Account created! You can now log in with your phone number.")}catch(h){c(h.message||"Signup failed")}finally{a(!1)}},cn=async f=>{f.preventDefault(),a(!0),c(""),d(""),p("");try{const h=await ze({identifier:y.email,password:y.password});if(h.success&&h.user)ue.login(h.user),!h.isVerified&&h.daysRemaining!==null&&(localStorage.setItem("verification_days_remaining",String(h.daysRemaining)),localStorage.setItem("verification_deadline",String(h.verificationDeadline))),t("/dashboard");else if(c(h.error||"Login failed"),h.requiresVerification){const w=h.email||y.email;p(w),Ne(_=>({..._,email:w}))}}catch(h){c(h.message||"Login error. Please try again.")}finally{a(!1)}},ln=async()=>{const f=(m||y.email).trim();if(!f){c("Enter your email address so we can resend your verification link.");return}a(!0),c(""),d("");try{const h=await We({email:f});if(h.alreadyVerified){d("Your account is already verified. Please log in."),p("");return}h!=null&&h.token&&(h!=null&&h.email)&&(h!=null&&h.name)&&await I({email:h.email,name:h.name,token:h.token,baseUrl:window.location.origin}),d("Verification email sent. Please check your inbox."),p(f)}catch(h){c(h.message||"Could not resend verification email. Please try again.")}finally{a(!1)}},dn=async f=>{f.preventDefault(),a(!0),c(""),d(""),p("");try{const h=await rn({email:_t});h!=null&&h.token&&(h!=null&&h.email)&&(h!=null&&h.name)&&await j({email:h.email,name:h.name,token:h.token,baseUrl:window.location.origin}),d("If that email exists in Q, a password reset link has been sent."),e("forgot")}catch(h){c(h.message||"Failed to send reset link. Please try again.")}finally{a(!1)}},hn=async f=>{if(f.preventDefault(),a(!0),c(""),d(""),Ee.length<6){c("Password must be at least 6 characters."),a(!1);return}if(Ee!==Et){c("Passwords do not match."),a(!1);return}try{const h=await an({token:qe,new_password:Ee});h.success?(d("Password reset successful. You can now log in."),Nt(""),St(""),kt(""),window.history.replaceState({},document.title,window.location.pathname),e("login")):c(h.error||"Unable to reset password.")}catch(h){c(h.message||"Unable to reset password. Please try again.")}finally{a(!1)}},Se=async(f,h)=>{a(!0),c(""),d("");try{if(!hs){c("Social login is not configured for this environment. Please use email login.");return}const _=(await la(hs,f)).user,S=await de({email:_.email||`${_.uid}@${h}.com`,full_name:_.displayName||"User",provider:h,provider_id:_.uid,profile_image_url:_.photoURL||void 0});if(S.success&&S.user){if(ue.login(S.user),S.isLocked){c(S.error||"Account locked");return}t("/dashboard")}else c(S.error||"Login failed")}catch(w){w.code!=="auth/popup-closed-by-user"&&w.code!=="auth/cancelled-popup-request"&&(c(w.message||"Social login error. Please try again."),console.error(w))}finally{a(!1)}};return i.jsxs("div",{className:"min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans overflow-x-hidden",children:[i.jsx("nav",{className:"fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-black/5 z-50",children:i.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between",children:[i.jsxs("div",{className:"flex items-center gap-2 sm:gap-3 cursor-pointer",onClick:()=>e("hero"),children:[i.jsx(fe,{className:"w-8 h-8 sm:w-10 sm:h-10"}),i.jsx("span",{className:"text-lg sm:text-xl font-bold tracking-tight",children:"jointheq"})]}),i.jsxs("div",{className:"flex items-center gap-4 sm:gap-6",children:[i.jsx("button",{onClick:()=>e("about"),className:`text-sm sm:text-base font-semibold transition-colors whitespace-nowrap ${s==="about"?"text-black":"text-black/50 hover:text-black"}`,children:"About Us"}),i.jsx("button",{onClick:()=>e("login"),className:"px-4 py-2 sm:px-6 sm:py-2.5 bg-black text-white rounded-xl font-bold text-sm sm:text-base hover:scale-105 transition-transform shadow-lg shadow-black/10 whitespace-nowrap",children:"Log In"})]})]})}),i.jsx("main",{className:"pt-32 sm:pt-40 pb-20",children:i.jsxs(pn,{mode:"wait",children:[s==="hero"&&i.jsx(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},className:"max-w-7xl mx-auto px-6",children:i.jsxs("div",{className:"grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-12rem)] relative",children:[i.jsxs("div",{className:"space-y-8 relative z-10",children:[i.jsxs(b.div,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1},transition:{delay:.2,duration:.5},className:"inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold uppercase tracking-wide",children:[i.jsx(Ot,{size:16}),i.jsx("span",{children:"Safe & Compliant"})]}),i.jsxs(b.h1,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.3,duration:.5},className:"text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]",children:["Split the bill. ",i.jsx("br",{}),i.jsx("span",{className:"text-black/40",children:"Stay premium."})," ",i.jsx("br",{}),"Spend less."]}),i.jsx(b.p,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.4,duration:.5},className:"text-lg text-black/60 max-w-lg leading-relaxed",children:"Join verified family-plan slots and reduce the cost of your favorite digital services without breaking platform rules."}),i.jsx(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.5,duration:.5},className:"flex flex-col sm:flex-row gap-4 pt-4",children:i.jsxs("button",{onClick:()=>e("signup"),className:"px-8 py-4 bg-black text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 group",children:["Get Started",i.jsx(gn,{size:20,className:"group-hover:translate-x-1 transition-transform"})]})}),i.jsxs(b.div,{initial:{opacity:0},animate:{opacity:1},transition:{delay:.8,duration:.5},className:"flex items-center gap-6 pt-8 border-t border-black/5",children:[i.jsx("div",{className:"flex -space-x-3",children:[1,2,3,4].map(f=>i.jsx("div",{className:"w-10 h-10 rounded-full border-2 border-[#F5F5F4] bg-gray-200 overflow-hidden",children:i.jsx("img",{src:`https://picsum.photos/seed/${f}/100/100`,alt:"User",referrerPolicy:"no-referrer"})},f))}),i.jsxs("div",{className:"text-sm font-medium text-black/60",children:["Trusted by ",i.jsx("span",{className:"text-black font-bold",children:"10,000+"})," smart savers"]})]})]}),i.jsx(b.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{delay:.4,duration:.7},children:i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-x-0 -top-20 -bottom-20 bg-gradient-to-b from-[#F26522]/5 to-transparent blur-3xl -z-10"}),i.jsxs("div",{className:"bg-white p-8 rounded-[3rem] shadow-2xl shadow-black/5 border border-black/5 backdrop-blur-sm bg-white/80",children:[i.jsxs("div",{className:"flex items-center justify-between mb-8",children:[i.jsx("div",{className:"font-bold text-xl",children:"Active Slots"}),i.jsx("div",{className:"w-10 h-10 bg-black/5 rounded-full flex items-center justify-center",children:i.jsx(Dt,{size:20})})]}),i.jsx("div",{className:"space-y-4",children:[{name:"Netflix Premium",price:"₦1,500",color:"bg-red-500",users:3,max:4},{name:"Spotify Duo",price:"₦800",color:"bg-emerald-500",users:1,max:2},{name:"YouTube Premium",price:"₦1,200",color:"bg-red-600",users:4,max:5}].map((f,h)=>i.jsxs(b.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{delay:.6+h*.1},className:"p-4 rounded-2xl border border-black/5 hover:border-black/10 transition-colors flex items-center justify-between",children:[i.jsxs("div",{className:"flex items-center gap-4",children:[i.jsx("div",{className:`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`,children:f.name[0]}),i.jsxs("div",{children:[i.jsx("div",{className:"font-bold",children:f.name}),i.jsxs("div",{className:"text-sm text-black/50",children:[f.users,"/",f.max," Members"]})]})]}),i.jsxs("div",{className:"text-right",children:[i.jsx("div",{className:"font-bold",children:f.price}),i.jsx("div",{className:"text-[10px] uppercase tracking-wider opacity-50 font-bold",children:"/ month"})]})]},h))})]})]})})]})},"hero"),s==="about"&&i.jsxs(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},className:"max-w-6xl mx-auto px-4 sm:px-6 space-y-32 pb-32",children:[i.jsxs("div",{className:"pt-12 md:pt-24 grid md:grid-cols-2 gap-12 items-center relative",children:[i.jsx(b.div,{initial:{opacity:0,x:-20},animate:{opacity:1,x:0},transition:{delay:.1},className:"relative z-10",children:i.jsxs("h1",{className:"text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8",children:["Why Q ",i.jsx("br",{}),i.jsx("span",{className:"text-black/30",children:"Exists."})]})}),i.jsxs(b.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{delay:.2},className:"text-xl md:text-2xl font-medium text-black/70 leading-relaxed space-y-6 border-l-2 border-black/10 pl-8",children:[i.jsx("p",{className:"text-black",children:"Premium tools became essential."}),i.jsx("p",{children:"Paying solo became expensive."}),i.jsx("p",{children:"People already shared subscriptions."}),i.jsxs("div",{className:"pt-4",children:[i.jsx("p",{className:"text-sm font-bold tracking-widest uppercase text-black/40 mb-4",children:"But it was:"}),i.jsxs("div",{className:"flex flex-wrap gap-3 text-sm font-bold",children:[i.jsx("span",{className:"px-4 py-2 bg-red-50 text-red-600 rounded-full",children:"Unstructured"}),i.jsx("span",{className:"px-4 py-2 bg-red-50 text-red-600 rounded-full",children:"Unreliable"}),i.jsx("span",{className:"px-4 py-2 bg-red-50 text-red-600 rounded-full",children:"Risky"})]})]})]})]}),i.jsxs(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.3},className:"bg-black text-white p-10 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden",children:[i.jsx("div",{className:"absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"}),i.jsxs("div",{className:"relative z-10",children:[i.jsxs("h2",{className:"text-4xl md:text-6xl lg:text-7xl font-bold mb-16 leading-tight tracking-tight",children:["Q didn't invent sharing.",i.jsx("br",{}),i.jsx("span",{className:"text-white/40",children:"We structured it."})]}),i.jsxs("div",{className:"grid md:grid-cols-3 gap-8 md:gap-12 text-lg font-medium text-white/70 mb-16",children:[i.jsxs("div",{className:"space-y-4",children:[i.jsx("div",{className:"w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center",children:i.jsx(Ot,{size:24})}),i.jsx("p",{children:"Verified onboarding for every member."})]}),i.jsxs("div",{className:"space-y-4",children:[i.jsx("div",{className:"w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center",children:i.jsx(Dt,{size:24})}),i.jsx("p",{children:"Strict adherence to official limits."})]}),i.jsxs("div",{className:"space-y-4",children:[i.jsx("div",{className:"w-12 h-12 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center",children:i.jsx(bn,{size:24})}),i.jsx("p",{children:"Transparent and automated cost sharing."})]})]}),i.jsx("div",{className:"pt-12 border-t border-white/10",children:i.jsxs("p",{className:"text-2xl md:text-4xl font-bold leading-tight",children:["Access should be affordable.",i.jsx("br",{}),i.jsx("span",{className:"text-white/50",children:"And done properly."})]})})]})]}),i.jsxs(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.4},children:[i.jsx("div",{className:"mb-16 md:flex justify-between items-end",children:i.jsxs("div",{children:[i.jsx("span",{className:"text-sm font-bold tracking-widest uppercase text-black/40 mb-4 block",children:"How It Works"}),i.jsxs("h2",{className:"text-4xl md:text-6xl font-bold tracking-tight",children:["Simple. Structured.",i.jsx("br",{}),"Secure."]})]})}),i.jsxs("div",{className:"grid md:grid-cols-3 gap-6 md:gap-8",children:[i.jsxs("div",{className:"bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm relative group hover:shadow-xl transition-all duration-500",children:[i.jsx("div",{className:"text-7xl font-black text-black/5 mb-8 group-hover:text-black/10 transition-colors tracking-tighter",children:"01"}),i.jsx("h3",{className:"text-2xl font-bold mb-4",children:"Enter the Circle"}),i.jsx("p",{className:"text-black/60 font-medium text-lg",children:"Browse verified family-plan slots tailored to your needs."})]}),i.jsxs("div",{className:"bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm relative group hover:shadow-xl transition-all duration-500 md:translate-y-8",children:[i.jsx("div",{className:"text-7xl font-black text-black/5 mb-8 group-hover:text-black/10 transition-colors tracking-tighter",children:"02"}),i.jsx("h3",{className:"text-2xl font-bold mb-4",children:"Lock Your Share"}),i.jsx("p",{className:"text-black/60 font-medium text-lg",children:"Join the group and pay your assigned portion securely."})]}),i.jsxs("div",{className:"bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm relative group hover:shadow-xl transition-all duration-500 md:translate-y-16",children:[i.jsx("div",{className:"text-7xl font-black text-black/5 mb-8 group-hover:text-black/10 transition-colors tracking-tighter",children:"03"}),i.jsx("h3",{className:"text-2xl font-bold mb-4",children:"Activate"}),i.jsx("p",{className:"text-black/60 font-medium text-lg",children:"Once the circle is complete, your premium access begins."})]})]})]}),i.jsxs(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.5},className:"grid lg:grid-cols-2 gap-16 items-center pt-16",children:[i.jsxs("div",{children:[i.jsxs("h2",{className:"text-5xl md:text-7xl font-bold mb-8 leading-[1]",children:["Built for Structure.",i.jsx("br",{}),i.jsx("span",{className:"text-black/30",children:"Not Shortcuts."})]}),i.jsx("p",{className:"text-xl text-black/60 font-medium max-w-md",children:"We believe in doing things the right way. No shady workarounds, just smart organization."})]}),i.jsxs("div",{className:"space-y-6",children:[i.jsxs("div",{className:"bg-red-50 p-8 md:p-10 rounded-[2.5rem] border border-red-100",children:[i.jsxs("h3",{className:"font-bold text-red-800 mb-6 flex items-center gap-3 text-2xl",children:[i.jsx(xn,{size:28})," We don't:"]}),i.jsxs("ul",{className:"space-y-4 text-red-900/70 font-bold text-lg",children:[i.jsxs("li",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-red-400"})," Resell subscriptions"]}),i.jsxs("li",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-red-400"})," Overfill plans"]}),i.jsxs("li",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-red-400"})," Bypass restrictions"]})]})]}),i.jsxs("div",{className:"bg-emerald-50 p-8 md:p-10 rounded-[2.5rem] border border-emerald-100",children:[i.jsxs("h3",{className:"font-bold text-emerald-800 mb-6 flex items-center gap-3 text-2xl",children:[i.jsx(yn,{size:28})," We do:"]}),i.jsxs("ul",{className:"space-y-4 text-emerald-900/70 font-bold text-lg",children:[i.jsxs("li",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400"})," Verify users"]}),i.jsxs("li",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400"})," Respect official limits"]}),i.jsxs("li",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400"})," Replace inactive members"]}),i.jsxs("li",{className:"flex items-center gap-3",children:[i.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400"})," Protect group stability"]})]})]})]})]}),i.jsxs(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.6},className:"bg-[#141414] text-white p-10 md:p-20 rounded-[3rem] text-center",children:[i.jsx("span",{className:"text-sm font-bold tracking-widest uppercase text-white/40 mb-8 block",children:"If You've Ever Said"}),i.jsx("h2",{className:"text-4xl md:text-6xl lg:text-7xl font-bold mb-20 italic text-white/90",children:'"Who wants to share this?"'}),i.jsxs("div",{className:"grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto",children:[i.jsxs("div",{className:"bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6",children:[i.jsx("span",{className:"text-4xl",children:"🎓"}),i.jsxs("div",{children:[i.jsx("h4",{className:"font-bold text-xl mb-2",children:"Students"}),i.jsx("p",{className:"text-white/60",children:"Cutting monthly costs without losing access to essential tools."})]})]}),i.jsxs("div",{className:"bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6",children:[i.jsx("span",{className:"text-4xl",children:"🎨"}),i.jsxs("div",{children:[i.jsx("h4",{className:"font-bold text-xl mb-2",children:"Creators"}),i.jsx("p",{className:"text-white/60",children:"Using premium creative suites daily for their work."})]})]}),i.jsxs("div",{className:"bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6",children:[i.jsx("span",{className:"text-4xl",children:"💼"}),i.jsxs("div",{children:[i.jsx("h4",{className:"font-bold text-xl mb-2",children:"Young Earners"}),i.jsx("p",{className:"text-white/60",children:"Optimizing expenses while building their careers."})]})]}),i.jsxs("div",{className:"bg-white/5 p-8 rounded-3xl border border-white/10 flex items-start gap-6",children:[i.jsx("span",{className:"text-4xl",children:"🧠"}),i.jsxs("div",{children:[i.jsx("h4",{className:"font-bold text-xl mb-2",children:"Smart Savers"}),i.jsx("p",{className:"text-white/60",children:"People who move intentionally with their finances."})]})]})]})]}),i.jsxs(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.7},className:"max-w-4xl mx-auto",children:[i.jsx("div",{className:"text-center mb-16",children:i.jsx("h2",{className:"text-4xl md:text-6xl font-bold tracking-tight",children:"Remove Final Doubts"})}),i.jsxs("div",{className:"grid md:grid-cols-2 gap-6 md:gap-8",children:[i.jsxs("div",{className:"bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm",children:[i.jsx("h3",{className:"font-bold text-xl mb-4",children:"Am I buying a subscription?"}),i.jsx("p",{className:"text-black/60 font-medium text-lg leading-relaxed",children:"No. You secure a slot in a shared family plan that is managed collectively."})]}),i.jsxs("div",{className:"bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm",children:[i.jsx("h3",{className:"font-bold text-xl mb-4",children:"Is this compliant?"}),i.jsx("p",{className:"text-black/60 font-medium text-lg leading-relaxed",children:"Yes. All plans follow the official family limits set by the providers."})]}),i.jsxs("div",{className:"bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm",children:[i.jsx("h3",{className:"font-bold text-xl mb-4",children:"What if someone stops paying?"}),i.jsx("p",{className:"text-black/60 font-medium text-lg leading-relaxed",children:"Members are seamlessly replaced to maintain group stability and uninterrupted access."})]}),i.jsxs("div",{className:"bg-white p-8 md:p-10 rounded-[2.5rem] border border-black/5 shadow-sm",children:[i.jsx("h3",{className:"font-bold text-xl mb-4",children:"Are users verified?"}),i.jsx("p",{className:"text-black/60 font-medium text-lg leading-relaxed",children:"Yes. Our structured onboarding ensures accountability for everyone in the circle."})]})]})]}),i.jsxs(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.8},className:"text-center pt-16 pb-12",children:[i.jsxs("h2",{className:"text-6xl md:text-8xl font-bold tracking-tighter mb-12 leading-[0.9]",children:["Stop Paying ",i.jsx("br",{}),i.jsx("span",{className:"text-black/30",children:"Solo."})]}),i.jsxs("div",{className:"flex flex-wrap justify-center gap-4 text-xl md:text-2xl font-bold text-black/60 mb-16",children:[i.jsx("span",{children:"Secure your slot."}),i.jsx("span",{className:"hidden sm:inline",children:"•"}),i.jsx("span",{children:"Split the bill."}),i.jsx("span",{className:"hidden sm:inline",children:"•"}),i.jsx("span",{children:"Stay premium."})]}),i.jsxs("div",{className:"flex flex-col sm:flex-row justify-center gap-4 mb-12",children:[i.jsx("button",{onClick:()=>e("signup"),className:"px-10 py-5 bg-black text-white rounded-2xl font-bold text-xl hover:scale-[1.02] transition-all shadow-xl shadow-black/10",children:"Lock My Slot"}),i.jsx("button",{onClick:()=>e("signup"),className:"px-10 py-5 bg-white border border-black/10 text-black rounded-2xl font-bold text-xl hover:bg-black/5 transition-all",children:"Get Started"})]}),i.jsxs("div",{className:"text-sm font-bold text-black/40 uppercase tracking-widest space-y-2",children:[i.jsx("p",{children:"Limited live positions."}),i.jsx("p",{children:"When a circle closes — it closes."})]})]})]},"about"),s==="login"&&i.jsx(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},className:"max-w-md mx-auto px-6 pt-12",children:i.jsxs("div",{className:"bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5",children:[i.jsxs("div",{className:"text-center mb-8",children:[i.jsx(fe,{className:"w-16 h-16 mx-auto mb-6"}),i.jsx("h2",{className:"text-3xl font-bold mb-2",children:"Welcome Back"}),i.jsx("p",{className:"text-black/60",children:"Log in to access your dashboard"})]}),o&&i.jsx("div",{className:"mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100",children:o}),l&&i.jsx("div",{className:"mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100",children:l}),n&&i.jsxs("div",{className:"mb-4 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100",children:["Referral detected: ",i.jsx("span",{className:"font-black",children:n})]}),m&&i.jsxs("div",{className:"mb-4 p-4 bg-orange-50 text-orange-700 rounded-xl text-sm font-bold border border-orange-100",children:[i.jsx("div",{children:"Your account still needs email verification."}),i.jsx("button",{type:"button",onClick:ln,disabled:r,className:"mt-3 w-full py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50",children:r?"Sending...":"Resend verification email"})]}),i.jsxs("div",{className:"mb-6",children:[i.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[i.jsxs("button",{type:"button",onClick:()=>Se(us,"google"),disabled:r,className:"flex items-center justify-center py-3 bg-[#F5F5F4] rounded-xl hover:bg-black/5 transition-colors font-semibold",children:[i.jsxs("svg",{className:"w-5 h-5 mr-2",viewBox:"0 0 24 24",children:[i.jsx("path",{fill:"#EA4335",d:"M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"}),i.jsx("path",{fill:"#34A853",d:"M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.806L1.248 17.4C3.208 21.348 7.28 24 12 24c3.059 0 5.842-1.154 7.961-3.139l-3.921-2.848z"}),i.jsx("path",{fill:"#4A90E2",d:"M23.655 12.273c0-.853-.075-1.705-.214-2.531H12v4.811h6.634c-.287 1.493-1.189 2.766-2.595 3.559l3.922 2.848c2.295-2.118 3.694-5.257 3.694-8.687z"}),i.jsx("path",{fill:"#FBBC05",d:"M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"})]}),"Google"]}),i.jsxs("button",{type:"button",onClick:()=>Se(fs,"apple"),disabled:r,className:"flex items-center justify-center py-3 bg-[#F5F5F4] rounded-xl hover:bg-black/5 transition-colors font-semibold",children:[i.jsx("svg",{className:"w-5 h-5 mr-2",viewBox:"0 0 24 24",fill:"currentColor",children:i.jsx("path",{d:"M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.05 2.95.72 3.86 1.84-3.21 1.94-2.61 6.32.72 7.82-1.04 2.45-2.14 4.31-3.23 3.35zm-2.05-15.6c.03-2.66-2.18-4.66-4.63-4.68-.13 2.77 2.44 4.79 4.63 4.68z"})}),"Apple"]})]}),i.jsxs("div",{className:"relative mt-6",children:[i.jsx("div",{className:"absolute inset-0 flex items-center",children:i.jsx("div",{className:"w-full border-t border-black/10"})}),i.jsx("div",{className:"relative flex justify-center text-sm",children:i.jsx("span",{className:"px-2 bg-white text-black/50",children:"Or log in with email or phone"})})]})]}),i.jsxs("form",{onSubmit:cn,className:"space-y-4",children:[i.jsxs("div",{children:[i.jsx("label",{className:"block text-sm font-bold mb-2",children:"Email or Phone Number"}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(wn,{size:20})}),i.jsx("input",{type:"text",name:"email",required:!0,value:y.email,onChange:X,className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"email@example.com or 08012345678"})]})]}),i.jsxs("div",{children:[i.jsx("label",{className:"block text-sm font-bold mb-2",children:"Password"}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(Te,{size:20})}),i.jsx("input",{type:"password",name:"password",required:!0,value:y.password,onChange:X,className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"••••••••"})]})]}),i.jsx("div",{className:"mt-3 text-right",children:i.jsx("button",{type:"button",onClick:()=>{It(y.email),c(""),d(""),e("forgot")},className:"text-sm font-bold text-black/60 hover:text-black hover:underline",children:"Forgot password?"})}),i.jsx("button",{type:"submit",disabled:r,className:"w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mt-6 disabled:opacity-50",children:r?"Verifying...":"Log In"})]}),i.jsxs("div",{className:"mt-8 text-center text-sm text-black/60",children:["Don't have an account?"," ",i.jsx("button",{onClick:()=>e("signup"),className:"text-black font-bold hover:underline",children:"Sign up"})]})]})},"login"),s==="forgot"&&i.jsx(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},className:"max-w-md mx-auto px-6 pt-12",children:i.jsxs("div",{className:"bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5",children:[i.jsxs("div",{className:"text-center mb-8",children:[i.jsx(fe,{className:"w-16 h-16 mx-auto mb-6"}),i.jsx("h2",{className:"text-3xl font-bold mb-2",children:"Reset Password"}),i.jsx("p",{className:"text-black/60",children:"Enter your email and we’ll send you a reset link."})]}),o&&i.jsx("div",{className:"mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100",children:o}),l&&i.jsx("div",{className:"mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100",children:l}),i.jsxs("form",{onSubmit:dn,className:"space-y-4",children:[i.jsxs("div",{children:[i.jsx("label",{className:"block text-sm font-bold mb-2",children:"Email Address"}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(Lt,{size:20})}),i.jsx("input",{type:"email",required:!0,value:_t,onChange:f=>It(f.target.value),className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"you@example.com"})]})]}),i.jsx("button",{type:"submit",disabled:r,className:"w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mt-6 disabled:opacity-50",children:r?"Sending reset link...":"Send Reset Link"})]}),i.jsxs("div",{className:"mt-8 text-center text-sm text-black/60",children:["Remember your password?"," ",i.jsx("button",{onClick:()=>{c(""),d(""),e("login")},className:"text-black font-bold hover:underline",children:"Back to login"})]})]})},"forgot"),s==="reset"&&i.jsx(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},className:"max-w-md mx-auto px-6 pt-12",children:i.jsxs("div",{className:"bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5",children:[i.jsxs("div",{className:"text-center mb-8",children:[i.jsx(fe,{className:"w-16 h-16 mx-auto mb-6"}),i.jsx("h2",{className:"text-3xl font-bold mb-2",children:"Choose New Password"}),i.jsx("p",{className:"text-black/60",children:"Set a new password for your Q account."})]}),he&&!he.valid&&i.jsx("div",{className:"mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100",children:he.message}),o&&i.jsx("div",{className:"mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100",children:o}),l&&i.jsx("div",{className:"mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100",children:l}),he===void 0?i.jsx("div",{className:"text-sm text-black/60 text-center py-8",children:"Checking reset link..."}):he.valid?i.jsxs("form",{onSubmit:hn,className:"space-y-4",children:[i.jsxs("div",{children:[i.jsx("label",{className:"block text-sm font-bold mb-2",children:"New Password"}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(Te,{size:20})}),i.jsx("input",{type:"password",required:!0,value:Ee,onChange:f=>Nt(f.target.value),className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"At least 6 characters"})]})]}),i.jsxs("div",{children:[i.jsx("label",{className:"block text-sm font-bold mb-2",children:"Confirm Password"}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(Te,{size:20})}),i.jsx("input",{type:"password",required:!0,value:Et,onChange:f=>St(f.target.value),className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"Repeat new password"})]})]}),i.jsx("button",{type:"submit",disabled:r,className:"w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mt-6 disabled:opacity-50",children:r?"Saving new password...":"Update Password"})]}):i.jsxs("div",{className:"space-y-6",children:[i.jsx("p",{className:"text-sm text-black/60 text-center",children:"This reset link can’t be used anymore. Request a fresh one to continue."}),i.jsx("button",{type:"button",onClick:()=>{c(""),d(""),e("forgot")},className:"w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform",children:"Request New Reset Link"})]})]})},"reset"),s==="signup"&&i.jsx(b.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.5,ease:"easeOut"},className:"max-w-md mx-auto px-6 pt-12",children:i.jsxs("div",{className:"bg-white p-8 rounded-[2rem] shadow-xl shadow-black/5 border border-black/5",children:[i.jsxs("div",{className:"text-center mb-8",children:[i.jsx(fe,{className:"w-16 h-16 mx-auto mb-6"}),i.jsx("h2",{className:"text-3xl font-bold mb-2",children:"Create Account"}),i.jsx("p",{className:"text-black/60",children:"Join the community and start saving"})]}),o&&i.jsx("div",{className:"mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100",children:o}),l&&i.jsx("div",{className:"mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100",children:l}),n&&i.jsxs("div",{className:"mb-4 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100",children:["Referral detected: ",i.jsx("span",{className:"font-black",children:n})]}),i.jsxs("div",{className:"mb-6",children:[i.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[i.jsxs("button",{type:"button",onClick:()=>Se(us,"google"),disabled:r,className:"flex items-center justify-center py-3 bg-[#F5F5F4] rounded-xl hover:bg-black/5 transition-colors font-semibold",children:[i.jsxs("svg",{className:"w-5 h-5 mr-2",viewBox:"0 0 24 24",children:[i.jsx("path",{fill:"#EA4335",d:"M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"}),i.jsx("path",{fill:"#34A853",d:"M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.806L1.248 17.4C3.208 21.348 7.28 24 12 24c3.059 0 5.842-1.154 7.961-3.139l-3.921-2.848z"}),i.jsx("path",{fill:"#4A90E2",d:"M23.655 12.273c0-.853-.075-1.705-.214-2.531H12v4.811h6.634c-.287 1.493-1.189 2.766-2.595 3.559l3.922 2.848c2.295-2.118 3.694-5.257 3.694-8.687z"}),i.jsx("path",{fill:"#FBBC05",d:"M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"})]}),"Google"]}),i.jsxs("button",{type:"button",onClick:()=>Se(fs,"apple"),disabled:r,className:"flex items-center justify-center py-3 bg-[#F5F5F4] rounded-xl hover:bg-black/5 transition-colors font-semibold",children:[i.jsx("svg",{className:"w-5 h-5 mr-2",viewBox:"0 0 24 24",fill:"currentColor",children:i.jsx("path",{d:"M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.05 2.95.72 3.86 1.84-3.21 1.94-2.61 6.32.72 7.82-1.04 2.45-2.14 4.31-3.23 3.35zm-2.05-15.6c.03-2.66-2.18-4.66-4.63-4.68-.13 2.77 2.44 4.79 4.63 4.68z"})}),"Apple"]})]}),i.jsxs("div",{className:"relative mt-6",children:[i.jsx("div",{className:"absolute inset-0 flex items-center",children:i.jsx("div",{className:"w-full border-t border-black/10"})}),i.jsx("div",{className:"relative flex justify-center text-sm",children:i.jsx("span",{className:"px-2 bg-white text-black/50",children:"Or create account with email or phone"})})]})]}),i.jsxs("form",{onSubmit:on,className:"space-y-4",children:[i.jsxs("div",{children:[i.jsx("label",{className:"block text-sm font-bold mb-2",children:"Full Name"}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(vn,{size:20})}),i.jsx("input",{type:"text",name:"name",required:!0,value:y.name,onChange:X,className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"John Doe"})]})]}),i.jsxs("div",{children:[i.jsxs("label",{className:"block text-sm font-bold mb-2",children:["Email Address ",i.jsx("span",{className:"text-black/40",children:"(optional)"})]}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(Lt,{size:20})}),i.jsx("input",{type:"email",name:"email",value:y.email,onChange:X,className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"you@example.com"})]})]}),i.jsxs("div",{children:[i.jsxs("label",{className:"block text-sm font-bold mb-2",children:["Phone Number ",i.jsx("span",{className:"text-black/40",children:"(optional)"})]}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(_n,{size:20})}),i.jsx("input",{type:"tel",name:"phone",value:y.phone,onChange:X,className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"0801 234 5678"})]})]}),i.jsx("p",{className:"text-xs font-semibold text-black/45",children:"Provide at least an email address or a phone number."}),i.jsxs("div",{children:[i.jsx("label",{className:"block text-sm font-bold mb-2",children:"Password"}),i.jsxs("div",{className:"relative",children:[i.jsx("div",{className:"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black/40",children:i.jsx(Te,{size:20})}),i.jsx("input",{type:"password",name:"password",required:!0,minLength:6,value:y.password,onChange:X,className:"w-full pl-12 pr-4 py-3 bg-[#F5F5F4] border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all",placeholder:"••••••••"})]})]}),i.jsx("button",{type:"submit",disabled:r||!!l,className:"w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mt-6 disabled:opacity-50",children:r?"Creating Account...":l?"Account Created":"Create Account"})]}),i.jsxs("div",{className:"mt-8 text-center text-sm text-black/60",children:["Already have an account?"," ",i.jsx("button",{onClick:()=>e("login"),className:"text-black font-bold hover:underline",children:"Log in"})]})]})},"signup")]})}),i.jsx("footer",{className:"py-8 text-center text-sm font-medium text-black/40",children:i.jsxs("div",{className:"flex flex-col items-center gap-1",children:[i.jsx("span",{children:"© 2026 Q"}),i.jsx("span",{children:"Built by CuratedbyQteam"})]})})]})}export{wo as default};
