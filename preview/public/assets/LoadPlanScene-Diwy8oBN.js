import{p as Nt,q as $,T as Q,S as Je,Q as Le,V as L,O as we,k as U,P as Ee,s as Rt,t as kt,I as Bt,F as et,v as Oe,w as J,W as Ht,n as De,m as ht,x as Ft,U as tt,y as nt,z as Wt,l as ee,A as Vt,b as pt,M as mt,r as w,f as G,a as Ce,_ as je,u as he,j as u,C as Yt,H as Gt,J as le,g as Zt,E as Kt,K as Xt,N as qt}from"./index-C_jG1hls.js";import{O as $t}from"./OrthographicCamera-DhBVm9xh.js";const gt=parseInt(Nt.replace(/\D+/g,"")),bt=gt>=125?"uv1":"uv2";var Qt=Object.defineProperty,Jt=(s,n,i)=>n in s?Qt(s,n,{enumerable:!0,configurable:!0,writable:!0,value:i}):s[n]=i,en=(s,n,i)=>(Jt(s,n+"",i),i);class tn{constructor(){en(this,"_listeners")}addEventListener(n,i){this._listeners===void 0&&(this._listeners={});const e=this._listeners;e[n]===void 0&&(e[n]=[]),e[n].indexOf(i)===-1&&e[n].push(i)}hasEventListener(n,i){if(this._listeners===void 0)return!1;const e=this._listeners;return e[n]!==void 0&&e[n].indexOf(i)!==-1}removeEventListener(n,i){if(this._listeners===void 0)return;const o=this._listeners[n];if(o!==void 0){const a=o.indexOf(i);a!==-1&&o.splice(a,1)}}dispatchEvent(n){if(this._listeners===void 0)return;const e=this._listeners[n.type];if(e!==void 0){n.target=this;const o=e.slice(0);for(let a=0,g=o.length;a<g;a++)o[a].call(this,n);n.target=null}}}var nn=Object.defineProperty,on=(s,n,i)=>n in s?nn(s,n,{enumerable:!0,configurable:!0,writable:!0,value:i}):s[n]=i,f=(s,n,i)=>(on(s,typeof n!="symbol"?n+"":n,i),i);const ce=new Rt,it=new kt,sn=Math.cos(70*(Math.PI/180)),ot=(s,n)=>(s%n+n)%n;let an=class extends tn{constructor(n,i){super(),f(this,"object"),f(this,"domElement"),f(this,"enabled",!0),f(this,"target",new L),f(this,"minDistance",0),f(this,"maxDistance",1/0),f(this,"minZoom",0),f(this,"maxZoom",1/0),f(this,"minPolarAngle",0),f(this,"maxPolarAngle",Math.PI),f(this,"minAzimuthAngle",-1/0),f(this,"maxAzimuthAngle",1/0),f(this,"enableDamping",!1),f(this,"dampingFactor",.05),f(this,"enableZoom",!0),f(this,"zoomSpeed",1),f(this,"enableRotate",!0),f(this,"rotateSpeed",1),f(this,"enablePan",!0),f(this,"panSpeed",1),f(this,"screenSpacePanning",!0),f(this,"keyPanSpeed",7),f(this,"zoomToCursor",!1),f(this,"autoRotate",!1),f(this,"autoRotateSpeed",2),f(this,"reverseOrbit",!1),f(this,"reverseHorizontalOrbit",!1),f(this,"reverseVerticalOrbit",!1),f(this,"keys",{LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"}),f(this,"mouseButtons",{LEFT:$.ROTATE,MIDDLE:$.DOLLY,RIGHT:$.PAN}),f(this,"touches",{ONE:Q.ROTATE,TWO:Q.DOLLY_PAN}),f(this,"target0"),f(this,"position0"),f(this,"zoom0"),f(this,"_domElementKeyEvents",null),f(this,"getPolarAngle"),f(this,"getAzimuthalAngle"),f(this,"setPolarAngle"),f(this,"setAzimuthalAngle"),f(this,"getDistance"),f(this,"getZoomScale"),f(this,"listenToKeyEvents"),f(this,"stopListenToKeyEvents"),f(this,"saveState"),f(this,"reset"),f(this,"update"),f(this,"connect"),f(this,"dispose"),f(this,"dollyIn"),f(this,"dollyOut"),f(this,"getScale"),f(this,"setScale"),this.object=n,this.domElement=i,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>c.phi,this.getAzimuthalAngle=()=>c.theta,this.setPolarAngle=t=>{let l=ot(t,2*Math.PI),m=c.phi;m<0&&(m+=2*Math.PI),l<0&&(l+=2*Math.PI);let x=Math.abs(l-m);2*Math.PI-x<x&&(l<m?l+=2*Math.PI:m+=2*Math.PI),h.phi=l-m,e.update()},this.setAzimuthalAngle=t=>{let l=ot(t,2*Math.PI),m=c.theta;m<0&&(m+=2*Math.PI),l<0&&(l+=2*Math.PI);let x=Math.abs(l-m);2*Math.PI-x<x&&(l<m?l+=2*Math.PI:m+=2*Math.PI),h.theta=l-m,e.update()},this.getDistance=()=>e.object.position.distanceTo(e.target),this.listenToKeyEvents=t=>{t.addEventListener("keydown",ve),this._domElementKeyEvents=t},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener("keydown",ve),this._domElementKeyEvents=null},this.saveState=()=>{e.target0.copy(e.target),e.position0.copy(e.object.position),e.zoom0=e.object.zoom},this.reset=()=>{e.target.copy(e.target0),e.object.position.copy(e.position0),e.object.zoom=e.zoom0,e.object.updateProjectionMatrix(),e.dispatchEvent(o),e.update(),d=r.NONE},this.update=(()=>{const t=new L,l=new L(0,1,0),m=new Le().setFromUnitVectors(n.up,l),x=m.clone().invert(),T=new L,W=new Le,Z=2*Math.PI;return function(){const Qe=e.object.position;m.setFromUnitVectors(n.up,l),x.copy(m).invert(),t.copy(Qe).sub(e.target),t.applyQuaternion(m),c.setFromVector3(t),e.autoRotate&&d===r.NONE&&pe(xt()),e.enableDamping?(c.theta+=h.theta*e.dampingFactor,c.phi+=h.phi*e.dampingFactor):(c.theta+=h.theta,c.phi+=h.phi);let V=e.minAzimuthAngle,Y=e.maxAzimuthAngle;isFinite(V)&&isFinite(Y)&&(V<-Math.PI?V+=Z:V>Math.PI&&(V-=Z),Y<-Math.PI?Y+=Z:Y>Math.PI&&(Y-=Z),V<=Y?c.theta=Math.max(V,Math.min(Y,c.theta)):c.theta=c.theta>(V+Y)/2?Math.max(V,c.theta):Math.min(Y,c.theta)),c.phi=Math.max(e.minPolarAngle,Math.min(e.maxPolarAngle,c.phi)),c.makeSafe(),e.enableDamping===!0?e.target.addScaledVector(y,e.dampingFactor):e.target.add(y),e.zoomToCursor&&R||e.object.isOrthographicCamera?c.radius=be(c.radius):c.radius=be(c.radius*v),t.setFromSpherical(c),t.applyQuaternion(x),Qe.copy(e.target).add(t),e.object.matrixAutoUpdate||e.object.updateMatrix(),e.object.lookAt(e.target),e.enableDamping===!0?(h.theta*=1-e.dampingFactor,h.phi*=1-e.dampingFactor,y.multiplyScalar(1-e.dampingFactor)):(h.set(0,0,0),y.set(0,0,0));let ne=!1;if(e.zoomToCursor&&R){let ie=null;if(e.object instanceof Ee&&e.object.isPerspectiveCamera){const oe=t.length();ie=be(oe*v);const re=oe-ie;e.object.position.addScaledVector(F,re),e.object.updateMatrixWorld()}else if(e.object.isOrthographicCamera){const oe=new L(N.x,N.y,0);oe.unproject(e.object),e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom/v)),e.object.updateProjectionMatrix(),ne=!0;const re=new L(N.x,N.y,0);re.unproject(e.object),e.object.position.sub(re).add(oe),e.object.updateMatrixWorld(),ie=t.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),e.zoomToCursor=!1;ie!==null&&(e.screenSpacePanning?e.target.set(0,0,-1).transformDirection(e.object.matrix).multiplyScalar(ie).add(e.object.position):(ce.origin.copy(e.object.position),ce.direction.set(0,0,-1).transformDirection(e.object.matrix),Math.abs(e.object.up.dot(ce.direction))<sn?n.lookAt(e.target):(it.setFromNormalAndCoplanarPoint(e.object.up,e.target),ce.intersectPlane(it,e.target))))}else e.object instanceof we&&e.object.isOrthographicCamera&&(ne=v!==1,ne&&(e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom/v)),e.object.updateProjectionMatrix()));return v=1,R=!1,ne||T.distanceToSquared(e.object.position)>b||8*(1-W.dot(e.object.quaternion))>b?(e.dispatchEvent(o),T.copy(e.object.position),W.copy(e.object.quaternion),ne=!1,!0):!1}})(),this.connect=t=>{e.domElement=t,e.domElement.style.touchAction="none",e.domElement.addEventListener("contextmenu",qe),e.domElement.addEventListener("pointerdown",Ke),e.domElement.addEventListener("pointercancel",te),e.domElement.addEventListener("wheel",Xe)},this.dispose=()=>{var t,l,m,x,T,W;e.domElement&&(e.domElement.style.touchAction="auto"),(t=e.domElement)==null||t.removeEventListener("contextmenu",qe),(l=e.domElement)==null||l.removeEventListener("pointerdown",Ke),(m=e.domElement)==null||m.removeEventListener("pointercancel",te),(x=e.domElement)==null||x.removeEventListener("wheel",Xe),(T=e.domElement)==null||T.ownerDocument.removeEventListener("pointermove",ye),(W=e.domElement)==null||W.ownerDocument.removeEventListener("pointerup",te),e._domElementKeyEvents!==null&&e._domElementKeyEvents.removeEventListener("keydown",ve)};const e=this,o={type:"change"},a={type:"start"},g={type:"end"},r={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let d=r.NONE;const b=1e-6,c=new Je,h=new Je;let v=1;const y=new L,S=new U,j=new U,M=new U,O=new U,I=new U,p=new U,A=new U,P=new U,_=new U,F=new L,N=new U;let R=!1;const E=[],se={};function xt(){return 2*Math.PI/60/60*e.autoRotateSpeed}function K(){return Math.pow(.95,e.zoomSpeed)}function pe(t){e.reverseOrbit||e.reverseHorizontalOrbit?h.theta+=t:h.theta-=t}function Ue(t){e.reverseOrbit||e.reverseVerticalOrbit?h.phi+=t:h.phi-=t}const Ne=(()=>{const t=new L;return function(m,x){t.setFromMatrixColumn(x,0),t.multiplyScalar(-m),y.add(t)}})(),Re=(()=>{const t=new L;return function(m,x){e.screenSpacePanning===!0?t.setFromMatrixColumn(x,1):(t.setFromMatrixColumn(x,0),t.crossVectors(e.object.up,t)),t.multiplyScalar(m),y.add(t)}})(),q=(()=>{const t=new L;return function(m,x){const T=e.domElement;if(T&&e.object instanceof Ee&&e.object.isPerspectiveCamera){const W=e.object.position;t.copy(W).sub(e.target);let Z=t.length();Z*=Math.tan(e.object.fov/2*Math.PI/180),Ne(2*m*Z/T.clientHeight,e.object.matrix),Re(2*x*Z/T.clientHeight,e.object.matrix)}else T&&e.object instanceof we&&e.object.isOrthographicCamera?(Ne(m*(e.object.right-e.object.left)/e.object.zoom/T.clientWidth,e.object.matrix),Re(x*(e.object.top-e.object.bottom)/e.object.zoom/T.clientHeight,e.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),e.enablePan=!1)}})();function me(t){e.object instanceof Ee&&e.object.isPerspectiveCamera||e.object instanceof we&&e.object.isOrthographicCamera?v=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),e.enableZoom=!1)}function ae(t){me(v/t)}function ge(t){me(v*t)}function ke(t){if(!e.zoomToCursor||!e.domElement)return;R=!0;const l=e.domElement.getBoundingClientRect(),m=t.clientX-l.left,x=t.clientY-l.top,T=l.width,W=l.height;N.x=m/T*2-1,N.y=-(x/W)*2+1,F.set(N.x,N.y,1).unproject(e.object).sub(e.object.position).normalize()}function be(t){return Math.max(e.minDistance,Math.min(e.maxDistance,t))}function Be(t){S.set(t.clientX,t.clientY)}function wt(t){ke(t),A.set(t.clientX,t.clientY)}function He(t){O.set(t.clientX,t.clientY)}function Et(t){j.set(t.clientX,t.clientY),M.subVectors(j,S).multiplyScalar(e.rotateSpeed);const l=e.domElement;l&&(pe(2*Math.PI*M.x/l.clientHeight),Ue(2*Math.PI*M.y/l.clientHeight)),S.copy(j),e.update()}function St(t){P.set(t.clientX,t.clientY),_.subVectors(P,A),_.y>0?ae(K()):_.y<0&&ge(K()),A.copy(P),e.update()}function Mt(t){I.set(t.clientX,t.clientY),p.subVectors(I,O).multiplyScalar(e.panSpeed),q(p.x,p.y),O.copy(I),e.update()}function _t(t){ke(t),t.deltaY<0?ge(K()):t.deltaY>0&&ae(K()),e.update()}function At(t){let l=!1;switch(t.code){case e.keys.UP:q(0,e.keyPanSpeed),l=!0;break;case e.keys.BOTTOM:q(0,-e.keyPanSpeed),l=!0;break;case e.keys.LEFT:q(e.keyPanSpeed,0),l=!0;break;case e.keys.RIGHT:q(-e.keyPanSpeed,0),l=!0;break}l&&(t.preventDefault(),e.update())}function Fe(){if(E.length==1)S.set(E[0].pageX,E[0].pageY);else{const t=.5*(E[0].pageX+E[1].pageX),l=.5*(E[0].pageY+E[1].pageY);S.set(t,l)}}function We(){if(E.length==1)O.set(E[0].pageX,E[0].pageY);else{const t=.5*(E[0].pageX+E[1].pageX),l=.5*(E[0].pageY+E[1].pageY);O.set(t,l)}}function Ve(){const t=E[0].pageX-E[1].pageX,l=E[0].pageY-E[1].pageY,m=Math.sqrt(t*t+l*l);A.set(0,m)}function Pt(){e.enableZoom&&Ve(),e.enablePan&&We()}function Lt(){e.enableZoom&&Ve(),e.enableRotate&&Fe()}function Ye(t){if(E.length==1)j.set(t.pageX,t.pageY);else{const m=xe(t),x=.5*(t.pageX+m.x),T=.5*(t.pageY+m.y);j.set(x,T)}M.subVectors(j,S).multiplyScalar(e.rotateSpeed);const l=e.domElement;l&&(pe(2*Math.PI*M.x/l.clientHeight),Ue(2*Math.PI*M.y/l.clientHeight)),S.copy(j)}function Ge(t){if(E.length==1)I.set(t.pageX,t.pageY);else{const l=xe(t),m=.5*(t.pageX+l.x),x=.5*(t.pageY+l.y);I.set(m,x)}p.subVectors(I,O).multiplyScalar(e.panSpeed),q(p.x,p.y),O.copy(I)}function Ze(t){const l=xe(t),m=t.pageX-l.x,x=t.pageY-l.y,T=Math.sqrt(m*m+x*x);P.set(0,T),_.set(0,Math.pow(P.y/A.y,e.zoomSpeed)),ae(_.y),A.copy(P)}function Ot(t){e.enableZoom&&Ze(t),e.enablePan&&Ge(t)}function jt(t){e.enableZoom&&Ze(t),e.enableRotate&&Ye(t)}function Ke(t){var l,m;e.enabled!==!1&&(E.length===0&&((l=e.domElement)==null||l.ownerDocument.addEventListener("pointermove",ye),(m=e.domElement)==null||m.ownerDocument.addEventListener("pointerup",te)),It(t),t.pointerType==="touch"?Ct(t):Tt(t))}function ye(t){e.enabled!==!1&&(t.pointerType==="touch"?zt(t):Dt(t))}function te(t){var l,m,x;Ut(t),E.length===0&&((l=e.domElement)==null||l.releasePointerCapture(t.pointerId),(m=e.domElement)==null||m.ownerDocument.removeEventListener("pointermove",ye),(x=e.domElement)==null||x.ownerDocument.removeEventListener("pointerup",te)),e.dispatchEvent(g),d=r.NONE}function Tt(t){let l;switch(t.button){case 0:l=e.mouseButtons.LEFT;break;case 1:l=e.mouseButtons.MIDDLE;break;case 2:l=e.mouseButtons.RIGHT;break;default:l=-1}switch(l){case $.DOLLY:if(e.enableZoom===!1)return;wt(t),d=r.DOLLY;break;case $.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){if(e.enablePan===!1)return;He(t),d=r.PAN}else{if(e.enableRotate===!1)return;Be(t),d=r.ROTATE}break;case $.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){if(e.enableRotate===!1)return;Be(t),d=r.ROTATE}else{if(e.enablePan===!1)return;He(t),d=r.PAN}break;default:d=r.NONE}d!==r.NONE&&e.dispatchEvent(a)}function Dt(t){if(e.enabled!==!1)switch(d){case r.ROTATE:if(e.enableRotate===!1)return;Et(t);break;case r.DOLLY:if(e.enableZoom===!1)return;St(t);break;case r.PAN:if(e.enablePan===!1)return;Mt(t);break}}function Xe(t){e.enabled===!1||e.enableZoom===!1||d!==r.NONE&&d!==r.ROTATE||(t.preventDefault(),e.dispatchEvent(a),_t(t),e.dispatchEvent(g))}function ve(t){e.enabled===!1||e.enablePan===!1||At(t)}function Ct(t){switch($e(t),E.length){case 1:switch(e.touches.ONE){case Q.ROTATE:if(e.enableRotate===!1)return;Fe(),d=r.TOUCH_ROTATE;break;case Q.PAN:if(e.enablePan===!1)return;We(),d=r.TOUCH_PAN;break;default:d=r.NONE}break;case 2:switch(e.touches.TWO){case Q.DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;Pt(),d=r.TOUCH_DOLLY_PAN;break;case Q.DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;Lt(),d=r.TOUCH_DOLLY_ROTATE;break;default:d=r.NONE}break;default:d=r.NONE}d!==r.NONE&&e.dispatchEvent(a)}function zt(t){switch($e(t),d){case r.TOUCH_ROTATE:if(e.enableRotate===!1)return;Ye(t),e.update();break;case r.TOUCH_PAN:if(e.enablePan===!1)return;Ge(t),e.update();break;case r.TOUCH_DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;Ot(t),e.update();break;case r.TOUCH_DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;jt(t),e.update();break;default:d=r.NONE}}function qe(t){e.enabled!==!1&&t.preventDefault()}function It(t){E.push(t)}function Ut(t){delete se[t.pointerId];for(let l=0;l<E.length;l++)if(E[l].pointerId==t.pointerId){E.splice(l,1);return}}function $e(t){let l=se[t.pointerId];l===void 0&&(l=new U,se[t.pointerId]=l),l.set(t.pageX,t.pageY)}function xe(t){const l=t.pointerId===E[0].pointerId?E[1]:E[0];return se[l.pointerId]}this.dollyIn=(t=K())=>{ge(t),e.update()},this.dollyOut=(t=K())=>{ae(t),e.update()},this.getScale=()=>v,this.setScale=t=>{me(t),e.update()},this.getZoomScale=()=>K(),i!==void 0&&this.connect(i),this.update()}};const st=new De,de=new L;class ze extends Bt{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const n=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],i=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],e=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(e),this.setAttribute("position",new et(n,3)),this.setAttribute("uv",new et(i,2))}applyMatrix4(n){const i=this.attributes.instanceStart,e=this.attributes.instanceEnd;return i!==void 0&&(i.applyMatrix4(n),e.applyMatrix4(n),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(n){let i;n instanceof Float32Array?i=n:Array.isArray(n)&&(i=new Float32Array(n));const e=new Oe(i,6,1);return this.setAttribute("instanceStart",new J(e,3,0)),this.setAttribute("instanceEnd",new J(e,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(n,i=3){let e;n instanceof Float32Array?e=n:Array.isArray(n)&&(e=new Float32Array(n));const o=new Oe(e,i*2,1);return this.setAttribute("instanceColorStart",new J(o,i,0)),this.setAttribute("instanceColorEnd",new J(o,i,i)),this}fromWireframeGeometry(n){return this.setPositions(n.attributes.position.array),this}fromEdgesGeometry(n){return this.setPositions(n.attributes.position.array),this}fromMesh(n){return this.fromWireframeGeometry(new Ht(n.geometry)),this}fromLineSegments(n){const i=n.geometry;return this.setPositions(i.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new De);const n=this.attributes.instanceStart,i=this.attributes.instanceEnd;n!==void 0&&i!==void 0&&(this.boundingBox.setFromBufferAttribute(n),st.setFromBufferAttribute(i),this.boundingBox.union(st))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ht),this.boundingBox===null&&this.computeBoundingBox();const n=this.attributes.instanceStart,i=this.attributes.instanceEnd;if(n!==void 0&&i!==void 0){const e=this.boundingSphere.center;this.boundingBox.getCenter(e);let o=0;for(let a=0,g=n.count;a<g;a++)de.fromBufferAttribute(n,a),o=Math.max(o,e.distanceToSquared(de)),de.fromBufferAttribute(i,a),o=Math.max(o,e.distanceToSquared(de));this.boundingSphere.radius=Math.sqrt(o),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(n){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(n)}}class yt extends ze{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(n){const i=n.length-3,e=new Float32Array(2*i);for(let o=0;o<i;o+=3)e[2*o]=n[o],e[2*o+1]=n[o+1],e[2*o+2]=n[o+2],e[2*o+3]=n[o+3],e[2*o+4]=n[o+4],e[2*o+5]=n[o+5];return super.setPositions(e),this}setColors(n,i=3){const e=n.length-i,o=new Float32Array(2*e);if(i===3)for(let a=0;a<e;a+=i)o[2*a]=n[a],o[2*a+1]=n[a+1],o[2*a+2]=n[a+2],o[2*a+3]=n[a+3],o[2*a+4]=n[a+4],o[2*a+5]=n[a+5];else for(let a=0;a<e;a+=i)o[2*a]=n[a],o[2*a+1]=n[a+1],o[2*a+2]=n[a+2],o[2*a+3]=n[a+3],o[2*a+4]=n[a+4],o[2*a+5]=n[a+5],o[2*a+6]=n[a+6],o[2*a+7]=n[a+7];return super.setColors(o,i),this}fromLine(n){const i=n.geometry;return this.setPositions(i.attributes.position.array),this}}class Ie extends Ft{constructor(n){super({type:"LineMaterial",uniforms:tt.clone(tt.merge([nt.common,nt.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new U(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${gt>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(i){this.uniforms.diffuse.value=i}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(i){i===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(i){this.uniforms.linewidth.value=i}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(i){!!i!="USE_DASH"in this.defines&&(this.needsUpdate=!0),i===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(i){this.uniforms.dashScale.value=i}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(i){this.uniforms.dashSize.value=i}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(i){this.uniforms.dashOffset.value=i}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(i){this.uniforms.gapSize.value=i}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(i){this.uniforms.opacity.value=i}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(i){this.uniforms.resolution.value.copy(i)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(i){!!i!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),i===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(n)}}const Se=new ee,at=new L,rt=new L,D=new ee,C=new ee,k=new ee,Me=new L,_e=new pt,z=new Vt,lt=new L,ue=new De,fe=new ht,B=new ee;let H,X;function ct(s,n,i){return B.set(0,0,-n,1).applyMatrix4(s.projectionMatrix),B.multiplyScalar(1/B.w),B.x=X/i.width,B.y=X/i.height,B.applyMatrix4(s.projectionMatrixInverse),B.multiplyScalar(1/B.w),Math.abs(Math.max(B.x,B.y))}function rn(s,n){const i=s.matrixWorld,e=s.geometry,o=e.attributes.instanceStart,a=e.attributes.instanceEnd,g=Math.min(e.instanceCount,o.count);for(let r=0,d=g;r<d;r++){z.start.fromBufferAttribute(o,r),z.end.fromBufferAttribute(a,r),z.applyMatrix4(i);const b=new L,c=new L;H.distanceSqToSegment(z.start,z.end,c,b),c.distanceTo(b)<X*.5&&n.push({point:c,pointOnLine:b,distance:H.origin.distanceTo(c),object:s,face:null,faceIndex:r,uv:null,[bt]:null})}}function ln(s,n,i){const e=n.projectionMatrix,a=s.material.resolution,g=s.matrixWorld,r=s.geometry,d=r.attributes.instanceStart,b=r.attributes.instanceEnd,c=Math.min(r.instanceCount,d.count),h=-n.near;H.at(1,k),k.w=1,k.applyMatrix4(n.matrixWorldInverse),k.applyMatrix4(e),k.multiplyScalar(1/k.w),k.x*=a.x/2,k.y*=a.y/2,k.z=0,Me.copy(k),_e.multiplyMatrices(n.matrixWorldInverse,g);for(let v=0,y=c;v<y;v++){if(D.fromBufferAttribute(d,v),C.fromBufferAttribute(b,v),D.w=1,C.w=1,D.applyMatrix4(_e),C.applyMatrix4(_e),D.z>h&&C.z>h)continue;if(D.z>h){const p=D.z-C.z,A=(D.z-h)/p;D.lerp(C,A)}else if(C.z>h){const p=C.z-D.z,A=(C.z-h)/p;C.lerp(D,A)}D.applyMatrix4(e),C.applyMatrix4(e),D.multiplyScalar(1/D.w),C.multiplyScalar(1/C.w),D.x*=a.x/2,D.y*=a.y/2,C.x*=a.x/2,C.y*=a.y/2,z.start.copy(D),z.start.z=0,z.end.copy(C),z.end.z=0;const j=z.closestPointToPointParameter(Me,!0);z.at(j,lt);const M=mt.lerp(D.z,C.z,j),O=M>=-1&&M<=1,I=Me.distanceTo(lt)<X*.5;if(O&&I){z.start.fromBufferAttribute(d,v),z.end.fromBufferAttribute(b,v),z.start.applyMatrix4(g),z.end.applyMatrix4(g);const p=new L,A=new L;H.distanceSqToSegment(z.start,z.end,A,p),i.push({point:A,pointOnLine:p,distance:H.origin.distanceTo(A),object:s,face:null,faceIndex:v,uv:null,[bt]:null})}}}class vt extends Wt{constructor(n=new ze,i=new Ie({color:Math.random()*16777215})){super(n,i),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const n=this.geometry,i=n.attributes.instanceStart,e=n.attributes.instanceEnd,o=new Float32Array(2*i.count);for(let g=0,r=0,d=i.count;g<d;g++,r+=2)at.fromBufferAttribute(i,g),rt.fromBufferAttribute(e,g),o[r]=r===0?0:o[r-1],o[r+1]=o[r]+at.distanceTo(rt);const a=new Oe(o,2,1);return n.setAttribute("instanceDistanceStart",new J(a,1,0)),n.setAttribute("instanceDistanceEnd",new J(a,1,1)),this}raycast(n,i){const e=this.material.worldUnits,o=n.camera;o===null&&!e&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const a=n.params.Line2!==void 0&&n.params.Line2.threshold||0;H=n.ray;const g=this.matrixWorld,r=this.geometry,d=this.material;X=d.linewidth+a,r.boundingSphere===null&&r.computeBoundingSphere(),fe.copy(r.boundingSphere).applyMatrix4(g);let b;if(e)b=X*.5;else{const h=Math.max(o.near,fe.distanceToPoint(H.origin));b=ct(o,h,d.resolution)}if(fe.radius+=b,H.intersectsSphere(fe)===!1)return;r.boundingBox===null&&r.computeBoundingBox(),ue.copy(r.boundingBox).applyMatrix4(g);let c;if(e)c=X*.5;else{const h=Math.max(o.near,ue.distanceToPoint(H.origin));c=ct(o,h,d.resolution)}ue.expandByScalar(c),H.intersectsBox(ue)!==!1&&(e?rn(this,i):ln(this,o,i))}onBeforeRender(n){const i=this.material.uniforms;i&&i.resolution&&(n.getViewport(Se),this.material.uniforms.resolution.value.set(Se.z,Se.w))}}class cn extends vt{constructor(n=new yt,i=new Ie({color:Math.random()*16777215})){super(n,i),this.isLine2=!0,this.type="Line2"}}const dn=w.forwardRef(function({points:n,color:i=16777215,vertexColors:e,linewidth:o,lineWidth:a,segments:g,dashed:r,...d},b){var c,h;const v=G(O=>O.size),y=w.useMemo(()=>g?new vt:new cn,[g]),[S]=w.useState(()=>new Ie),j=(e==null||(c=e[0])==null?void 0:c.length)===4?4:3,M=w.useMemo(()=>{const O=g?new ze:new yt,I=n.map(p=>{const A=Array.isArray(p);return p instanceof L||p instanceof ee?[p.x,p.y,p.z]:p instanceof U?[p.x,p.y,0]:A&&p.length===3?[p[0],p[1],p[2]]:A&&p.length===2?[p[0],p[1],0]:p});if(O.setPositions(I.flat()),e){i=16777215;const p=e.map(A=>A instanceof Ce?A.toArray():A);O.setColors(p.flat(),j)}return O},[n,g,e,j]);return w.useLayoutEffect(()=>{y.computeLineDistances()},[n,y]),w.useLayoutEffect(()=>{r?S.defines.USE_DASH="":delete S.defines.USE_DASH,S.needsUpdate=!0},[r,S]),w.useEffect(()=>()=>{M.dispose(),S.dispose()},[M]),w.createElement("primitive",je({object:y,ref:b},d),w.createElement("primitive",{object:M,attach:"geometry"}),w.createElement("primitive",je({object:S,attach:"material",color:i,vertexColors:!!e,resolution:[v.width,v.height],linewidth:(h=o??a)!==null&&h!==void 0?h:1,dashed:r,transparent:j===4},d)))}),un=w.forwardRef(({makeDefault:s,camera:n,regress:i,domElement:e,enableDamping:o=!0,keyEvents:a=!1,onChange:g,onStart:r,onEnd:d,...b},c)=>{const h=G(_=>_.invalidate),v=G(_=>_.camera),y=G(_=>_.gl),S=G(_=>_.events),j=G(_=>_.setEvents),M=G(_=>_.set),O=G(_=>_.get),I=G(_=>_.performance),p=n||v,A=e||S.connected||y.domElement,P=w.useMemo(()=>new an(p),[p]);return he(()=>{P.enabled&&P.update()},-1),w.useEffect(()=>(a&&P.connect(a===!0?A:a),P.connect(A),()=>{P.dispose()}),[a,A,i,P,h]),w.useEffect(()=>{const _=R=>{h(),i&&I.regress(),g&&g(R)},F=R=>{r&&r(R)},N=R=>{d&&d(R)};return P.addEventListener("change",_),P.addEventListener("start",F),P.addEventListener("end",N),()=>{P.removeEventListener("start",F),P.removeEventListener("end",N),P.removeEventListener("change",_)}},[g,r,d,P,h,j]),w.useEffect(()=>{if(s){const _=O().controls;return M({controls:P}),()=>M({controls:_})}},[s,P]),w.createElement("primitive",je({ref:c,object:P,enableDamping:o},b))}),Te=.55,fn=s=>1-Math.pow(1-s,3);function hn(){const s=Gt();return w.useMemo(()=>({floor:s==="light"?"#E8EDF2":"#0C0F13",fog:le("--bg-void")||(s==="light"?"#E4E9EE":"#07090C"),edge:le("--accent")||"#FF6B1A",ghost:le("--bg-surface")||(s==="light"?"#ffffff":"#12161C"),teal:le("--data")||"#2DD4BF",carton:s==="light"?"#D8B48C":"#C8A27A",upright:s==="light"?"#8A94A0":"#39424E",ambient:s==="light"?.55:.25,key:s==="light"?.55:.3}),[s])}function pn({clock:s,running:n,onPlaced:i,schedule:e,total:o}){const a=w.useRef(-1);return he((g,r)=>{if(!n)return;s.current+=Math.min(r,.1);let d=0;for(let b=0;b<o;b++)(e[b]??1/0)<=s.current&&d++;d!==a.current&&(a.current=d,i(d))}),null}const dt=new pt,Ae=new L,mn=new Le,ut=new L,Pe=new Ce,ft=new Ce;function gn({placed:s,clock:n,running:i,schedule:e,mode:o,stops:a=5,palette:g,space:r}){const d=w.useRef(null),b=w.useMemo(()=>s.map(c=>({x:c.x+c.dx/2-r.lengthM/2,y:c.z+c.dz/2,z:c.y+c.dy/2-r.widthM/2,dx:c.dx,dy:c.dz,dz:c.dy,layer:Math.round(c.z/.42)})),[s,r.lengthM,r.widthM]);return w.useEffect(()=>{ft.set(g.edge)},[g.edge]),he(()=>{const c=d.current;if(!c)return;const h=n.current;let v=0;if(i)for(let y=0;y<b.length;y++)(e[y]??1/0)<=h&&(v=y+1);for(let y=0;y<v;y++){const S=b[y],j=mt.clamp((h-(e[y]??0))/Te,0,1),M=fn(j),O=-r.lengthM/2-5,I=r.heightM+2.5,p=1-M;Ae.set(p*p*O+2*p*M*((O+S.x)/2)+M*M*S.x,p*p*I+2*p*M*(I+1.5)+M*M*S.y,p*p*0+2*p*M*S.z+M*M*S.z);const A=.6+.4*M,P=j>=1?1+.1*Math.max(0,1-(h-(e[y]??0)-Te)/.15):A,_=o==="layers"?S.layer*.32:0;if(ut.set(S.dx*P,S.dy*P,S.dz*P),Ae.y+=_,dt.compose(Ae,mn,ut),c.setMatrixAt(y,dt),o==="sequence"){const F=Math.min(a-1,Math.floor(y/Math.max(1,b.length)*a));Pe.set(g.teal).lerp(ft,F/Math.max(1,a-1))}else{const F=1+(y*37%11/10-.5)*.3;Pe.set(g.carton).multiplyScalar(F)}c.setColorAt(y,Pe)}c.count=v,c.instanceMatrix.needsUpdate=!0,c.instanceColor&&(c.instanceColor.needsUpdate=!0)}),u.jsxs("instancedMesh",{ref:d,args:[void 0,void 0,Math.max(1,b.length)],frustumCulled:!1,children:[u.jsx("boxGeometry",{args:[1,1,1]}),o==="wireframe"?u.jsx("meshBasicMaterial",{wireframe:!0,color:g.teal,transparent:!0,opacity:.85}):u.jsx("meshStandardMaterial",{roughness:.85,metalness:.02,transparent:!0,opacity:.96})]})}function bn({space:s,palette:n}){const{lengthM:i,widthM:e,heightM:o}=s,a=w.useMemo(()=>{const g=new Zt(i,o,e),r=new Kt(g);return g.dispose(),r},[i,e,o]);return u.jsxs("group",{position:[0,o/2,0],children:[u.jsxs("mesh",{children:[u.jsx("boxGeometry",{args:[i,o,e]}),u.jsx("meshBasicMaterial",{color:n.ghost,transparent:!0,opacity:.1,depthWrite:!1,side:Xt})]}),u.jsx("lineSegments",{geometry:a,children:u.jsx("lineBasicMaterial",{color:n.edge,transparent:!0,opacity:.9})})]})}function yn({placed:s,clock:n,schedule:i,palette:e,space:o}){const[a,g]=w.useState(-1);he(()=>{const d=n.current;let b=-1;for(let c=s.length-1;c>=0;c--){const h=i[c]??1/0;if(d>=h&&d-h<Te+.1){b=c;break}}b!==a&&g(b)});const r=w.useMemo(()=>{if(a<0)return null;const d=s[a],b=d.x+d.dx/2-o.lengthM/2,c=d.z+d.dz/2,h=d.y+d.dy/2-o.widthM/2,v=-o.lengthM/2-5,y=o.heightM+2.5;return new qt(new L(v,y,0),new L((v+b)/2,y+1.5,h),new L(b,c,h)).getPoints(24)},[a,s,o]);return r?u.jsx(dn,{points:r,color:e.teal,lineWidth:2,transparent:!0,opacity:.7}):null}function vn(s){const{cargo:n,palette:i,runKey:e}=s,o=e>0;w.useEffect(()=>{s.clock.current=0},[e]);const a=Math.max(n.lengthM,n.widthM)*1.5+8;return u.jsxs(u.Fragment,{children:[u.jsx($t,{makeDefault:!0,position:[a,n.heightM*2+7,a],zoom:s.detail==="hero"?26:30,near:-100,far:300}),u.jsx(un,{makeDefault:!0,enableZoom:!1,enablePan:!1,enableRotate:!0,target:[0,n.heightM/2,0],maxPolarAngle:Math.PI/2.05}),u.jsx("fog",{attach:"fog",args:[i.fog,60,160]}),u.jsx("ambientLight",{intensity:i.ambient}),u.jsx("directionalLight",{position:[12,18,8],intensity:i.key+.6,color:"#ffe8d6"}),u.jsx("directionalLight",{position:[-10,8,-6],intensity:i.key*.6,color:i.teal}),u.jsxs("mesh",{rotation:[-Math.PI/2,0,0],position:[0,-.02,0],children:[u.jsx("planeGeometry",{args:[90,90]}),u.jsx("meshStandardMaterial",{color:i.floor})]}),u.jsx("gridHelper",{args:[90,90,i.upright,i.upright],position:[0,.001,0]}),u.jsx(bn,{space:n,palette:i}),u.jsx(gn,{placed:s.placed,clock:s.clock,running:o,schedule:s.schedule,mode:s.mode??"solid",stops:s.stops,palette:i,space:n}),u.jsx(yn,{placed:s.placed,clock:s.clock,schedule:s.schedule,palette:i,space:n}),u.jsx(pn,{clock:s.clock,running:o,onPlaced:s.onPlaced,schedule:s.schedule,total:s.placed.length})]})}function xn({volPct:s,wtPct:n}){const e=2*Math.PI*26,o=18,a=2*Math.PI*o;return u.jsxs("div",{className:"flex items-center gap-3 rounded-lg border border-line bg-surface/80 px-3 py-2 backdrop-blur",children:[u.jsxs("svg",{width:"64",height:"64",viewBox:"0 0 64 64",className:"-rotate-90",children:[u.jsx("circle",{cx:"32",cy:"32",r:26,fill:"none",stroke:"var(--line)",strokeWidth:"5"}),u.jsx("circle",{cx:"32",cy:"32",r:26,fill:"none",stroke:"var(--data)",strokeWidth:"5",strokeLinecap:"round",strokeDasharray:e,strokeDashoffset:e*(1-Math.min(100,s)/100),style:{transition:"stroke-dashoffset 0.25s linear"}}),u.jsx("circle",{cx:"32",cy:"32",r:o,fill:"none",stroke:"var(--line)",strokeWidth:"4"}),u.jsx("circle",{cx:"32",cy:"32",r:o,fill:"none",stroke:"var(--accent)",strokeWidth:"4",strokeLinecap:"round",strokeDasharray:a,strokeDashoffset:a*(1-Math.min(100,n)/100),style:{transition:"stroke-dashoffset 0.25s linear"}})]}),u.jsxs("div",{className:"font-mono text-[10px] uppercase leading-4 tracking-[0.12em]",children:[u.jsxs("div",{className:"font-tnum text-data",children:["VOL ",s.toFixed(0),"%"]}),u.jsxs("div",{className:"font-tnum text-brand",children:["WT ",n.toFixed(0),"%"]})]})]})}function wn({wtPct:s}){const n=[{label:"STEER",pct:Math.min(115,s*.9+8),limit:"6T"},{label:"DRIVE",pct:Math.min(108,s*1.04),limit:"19T"}];return u.jsx("div",{className:"space-y-2 rounded-lg border border-line bg-surface/80 px-3 py-2 backdrop-blur",children:n.map(i=>u.jsxs("div",{children:[u.jsxs("div",{className:"mb-1 flex justify-between gap-6 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2",children:[u.jsx("span",{children:i.label}),u.jsxs("span",{className:i.pct>100?"text-crit":"text-data",children:[i.pct.toFixed(0),"% / ",i.limit," ",i.pct>100?"✕":"✓"]})]}),u.jsx("div",{className:"h-1.5 w-36 overflow-hidden rounded-full bg-raised",children:u.jsx("div",{className:i.pct>100?"h-full rounded-full bg-crit":"h-full rounded-full bg-data",style:{width:`${Math.min(100,i.pct)}%`,transition:"width 0.4s ease"}})})]},i.label))})}function An(s){const n=hn(),i=w.useRef(null),e=w.useRef(0),[o,a]=w.useState(!1),[g,r]=w.useState(0);w.useEffect(()=>{r(0),e.current=0},[s.runKey]),w.useEffect(()=>{const v=i.current;if(!v)return;const y=new IntersectionObserver(([S])=>a(S.isIntersecting),{rootMargin:"50% 0px"});return y.observe(v),()=>y.disconnect()},[]);const d=Math.max(1,s.placed.length),b=g/d,c=(s.finalVolPct??0)*b,h=(s.finalWtPct??0)*b;return u.jsxs("div",{ref:i,className:s.className,style:{position:"relative"},children:[o&&u.jsx(Yt,{dpr:[1,1.75],style:{position:"absolute",inset:0},gl:{antialias:!0},children:u.jsx(vn,{...s,palette:n,clock:e,onPlaced:r})}),u.jsx("div",{className:"pointer-events-none absolute right-3 top-3",children:u.jsx(xn,{volPct:c,wtPct:h})}),u.jsxs("div",{className:"pointer-events-none absolute left-3 top-3 rounded-lg border border-line bg-surface/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink1 backdrop-blur",children:[u.jsx("span",{className:"font-tnum text-ink0",children:g}),u.jsxs("span",{className:"text-ink2",children:["/",s.placed.length," ITEMS PLACED"]}),s.leftoverNote&&u.jsx("div",{className:"mt-1 text-warn",children:s.leftoverNote})]}),s.detail==="full"&&u.jsx("div",{className:"pointer-events-none absolute bottom-3 left-3",children:u.jsx(wn,{wtPct:h})})]})}export{An as default};
