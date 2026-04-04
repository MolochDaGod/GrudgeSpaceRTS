import{a_ as Bt,a$ as Io,b0 as Ht,H as dt,t as De,b1 as Aa,V as Re,v as Do,b2 as it,b3 as Qe,b4 as pt,b5 as or,b6 as Ra,r as ke,b7 as sr,b8 as Vt,aT as ze,Y as tn,b9 as on,D as Gt,ag as Rt,aL as Cn,aR as bt,ba as Uo,l as an,F as en,bb as No,m as It,bc as Ki,bd as tt,be as Fo,d as vt,a3 as An,bf as Oo,bg as mi,y as Kt,bh as En,bi as Pn,bj as kn,bk as hn,bl as ai,bm as Bo,bn as Go,bo as zn,W as xt,Z as wn,N as Sn,bp as cr,bq as Ho,br as Vo,bs as Dn,bt as ko,bu as zo,bv as Wo,bw as Xo,bx as Ko,by as qo,bz as Yo,bA as jo,bB as $o,bC as Zo,bD as Qo,bE as Jo,bF as es,bG as ts,bH as ns,$ as ba,_ as Ln,X as ei,U as On,K as Ca,J as qt,bI as is,bJ as rs,bK as qi,bL as as,bM as Yi,bN as os,bO as ss,bP as cs,f as ls,bQ as He,bR as fs,bS as us,aH as jt,u as pn,bT as ti,aj as ds,bU as Yt,bV as Bn,bW as nn,bX as ps,bY as Pa,bZ as wa,b_ as La,b$ as oi,c0 as ya,c1 as Ia,c2 as Da,s as Ua,c3 as hs,c4 as ms,c5 as _s,c6 as gs,c7 as Na,c8 as vs,c9 as Ss,ca as Es,cb as _i,cc as gi,cd as vi,ce as Si,cf as lr,cg as fr,ch as ur,ci as dr,cj as pr,ck as hr,cl as mr,cm as _r,cn as gr,co as vr,cp as Sr,cq as Er,cr as xr,cs as Tr,ct as Mr,cu as Ar,cv as Rr,cw as br,cx as Cr,cy as Pr,cz as wr,cA as Lr,cB as yr,cC as Ir,cD as Dr,cE as Ur,cF as Nr,cG as Fr,cH as Or,cI as Br,cJ as Gr,cK as Hr,cL as xs,cM as Ts,cN as Ms,cO as As,cP as Rs,cQ as bs,cR as Cs,cS as Ps,cT as Vr,cU as ws,cV as ni,cW as Ls,cX as kr,cY as zr,ax as Wr,cZ as Fa,c_ as ys,c$ as fi,d0 as Is,d1 as Ds,d2 as Oa,k as ji,d3 as Ni,E as Xt,d4 as Ba,d5 as Us,d6 as Ga,d7 as Ha,d8 as Va,a2 as ka,d9 as za,da as Wa,db as Xa,dc as Xr,dd as Ka,de as ii,df as Ei,dg as Ns,dh as qa,di as Kr,dj as Mt,aC as Fs,dk as Wn,dl as yn,i as xn,dm as Os,dn as Bs,dp as Gs,dq as Hs,dr as Vs,ds as si,dt as ks,du as zs,dv as Ws,dw as Xs,dx as Fi,dy as Ya,aP as ci,aY as Rn,aQ as $i,aI as kt,dz as ja,ac as Oi,a5 as $a,aO as Ks,Q as Nt,aD as qs,O as Tn,ab as Za,dA as Ys,aS as js,ae as $s,aV as xi,L as Qa,a9 as Ja,z as Xn,dB as eo,aX as Zs,o as to,dC as Qs,af as Js,a6 as Hn,g as Et,dD as no,dE as io,dF as Bi,A as ec,a0 as ro,aU as tc,dG as Gi,dH as Hi,dI as li,dJ as nc,a7 as ic,dK as rc,dL as ac,aW as $n,dM as oc,a4 as sc,dN as cc}from"./main-DBh1e4UD.js";/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function ao(){let n=null,t=!1,e=null,i=null;function r(a,o){e(a,o),i=n.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(i=n.requestAnimationFrame(r),t=!0)},stop:function(){n.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){e=a},setContext:function(a){n=a}}}function lc(n){const t=new WeakMap;function e(s,c){const l=s.array,d=s.usage,u=l.byteLength,f=n.createBuffer();n.bindBuffer(c,f),n.bufferData(c,l,d),s.onUploadCallback();let _;if(l instanceof Float32Array)_=n.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)_=n.HALF_FLOAT;else if(l instanceof Uint16Array)s.isFloat16BufferAttribute?_=n.HALF_FLOAT:_=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)_=n.SHORT;else if(l instanceof Uint32Array)_=n.UNSIGNED_INT;else if(l instanceof Int32Array)_=n.INT;else if(l instanceof Int8Array)_=n.BYTE;else if(l instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:_,bytesPerElement:l.BYTES_PER_ELEMENT,version:s.version,size:u}}function i(s,c,l){const d=c.array,u=c.updateRanges;if(n.bindBuffer(l,s),u.length===0)n.bufferSubData(l,0,d);else{u.sort((_,S)=>_.start-S.start);let f=0;for(let _=1;_<u.length;_++){const S=u[f],R=u[_];R.start<=S.start+S.count+1?S.count=Math.max(S.count,R.start+R.count-S.start):(++f,u[f]=R)}u.length=f+1;for(let _=0,S=u.length;_<S;_++){const R=u[_];n.bufferSubData(l,R.start*d.BYTES_PER_ELEMENT,d,R.start,R.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(s){return s.isInterleavedBufferAttribute&&(s=s.data),t.get(s)}function a(s){s.isInterleavedBufferAttribute&&(s=s.data);const c=t.get(s);c&&(n.deleteBuffer(c.buffer),t.delete(s))}function o(s,c){if(s.isInterleavedBufferAttribute&&(s=s.data),s.isGLBufferAttribute){const d=t.get(s);(!d||d.version<s.version)&&t.set(s,{buffer:s.buffer,type:s.type,bytesPerElement:s.elementSize,version:s.version});return}const l=t.get(s);if(l===void 0)t.set(s,e(s,c));else if(l.version<s.version){if(l.size!==s.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,s,c),l.version=s.version}}return{get:r,remove:a,update:o}}var fc=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,uc=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,dc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,pc=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hc=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,mc=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,_c=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,gc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,vc=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Sc=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ec=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,xc=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Tc=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Mc=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ac=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Rc=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,bc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Cc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Pc=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,wc=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Lc=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,yc=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Ic=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Dc=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Uc=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Nc=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Fc=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Oc=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Bc=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Gc=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Hc="gl_FragColor = linearToOutputTexel( gl_FragColor );",Vc=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,kc=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,zc=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Wc=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Xc=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Kc=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,qc=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Yc=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,jc=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,$c=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Zc=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Qc=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Jc=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,el=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,tl=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,nl=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,il=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,rl=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,al=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ol=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,sl=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,cl=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return v;
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ll=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,fl=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ul=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,dl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,pl=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,hl=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ml=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,_l=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,gl=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,vl=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Sl=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,El=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,xl=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Tl=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Ml=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Al=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Rl=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,bl=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cl=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Pl=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,wl=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ll=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yl=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Il=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Dl=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ul=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Nl=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Fl=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ol=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Bl=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Gl=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Hl=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Vl=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,kl=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,zl=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Wl=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Xl=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Kl=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,ql=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Yl=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,jl=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,$l=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Zl=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Ql=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Jl=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ef=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,nf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,rf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,af=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,of=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,sf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,cf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,lf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const ff=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,uf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,df=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,pf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,mf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_f=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,gf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,vf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Sf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Ef=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,xf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Mf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Af=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Rf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Cf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Pf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,wf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,yf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,If=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Df=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Uf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Nf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ff=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Of=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Gf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Hf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Vf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,kf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,zf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ie={alphahash_fragment:fc,alphahash_pars_fragment:uc,alphamap_fragment:dc,alphamap_pars_fragment:pc,alphatest_fragment:hc,alphatest_pars_fragment:mc,aomap_fragment:_c,aomap_pars_fragment:gc,batching_pars_vertex:vc,batching_vertex:Sc,begin_vertex:Ec,beginnormal_vertex:xc,bsdfs:Tc,iridescence_fragment:Mc,bumpmap_pars_fragment:Ac,clipping_planes_fragment:Rc,clipping_planes_pars_fragment:bc,clipping_planes_pars_vertex:Cc,clipping_planes_vertex:Pc,color_fragment:wc,color_pars_fragment:Lc,color_pars_vertex:yc,color_vertex:Ic,common:Dc,cube_uv_reflection_fragment:Uc,defaultnormal_vertex:Nc,displacementmap_pars_vertex:Fc,displacementmap_vertex:Oc,emissivemap_fragment:Bc,emissivemap_pars_fragment:Gc,colorspace_fragment:Hc,colorspace_pars_fragment:Vc,envmap_fragment:kc,envmap_common_pars_fragment:zc,envmap_pars_fragment:Wc,envmap_pars_vertex:Xc,envmap_physical_pars_fragment:nl,envmap_vertex:Kc,fog_vertex:qc,fog_pars_vertex:Yc,fog_fragment:jc,fog_pars_fragment:$c,gradientmap_pars_fragment:Zc,lightmap_pars_fragment:Qc,lights_lambert_fragment:Jc,lights_lambert_pars_fragment:el,lights_pars_begin:tl,lights_toon_fragment:il,lights_toon_pars_fragment:rl,lights_phong_fragment:al,lights_phong_pars_fragment:ol,lights_physical_fragment:sl,lights_physical_pars_fragment:cl,lights_fragment_begin:ll,lights_fragment_maps:fl,lights_fragment_end:ul,logdepthbuf_fragment:dl,logdepthbuf_pars_fragment:pl,logdepthbuf_pars_vertex:hl,logdepthbuf_vertex:ml,map_fragment:_l,map_pars_fragment:gl,map_particle_fragment:vl,map_particle_pars_fragment:Sl,metalnessmap_fragment:El,metalnessmap_pars_fragment:xl,morphinstance_vertex:Tl,morphcolor_vertex:Ml,morphnormal_vertex:Al,morphtarget_pars_vertex:Rl,morphtarget_vertex:bl,normal_fragment_begin:Cl,normal_fragment_maps:Pl,normal_pars_fragment:wl,normal_pars_vertex:Ll,normal_vertex:yl,normalmap_pars_fragment:Il,clearcoat_normal_fragment_begin:Dl,clearcoat_normal_fragment_maps:Ul,clearcoat_pars_fragment:Nl,iridescence_pars_fragment:Fl,opaque_fragment:Ol,packing:Bl,premultiplied_alpha_fragment:Gl,project_vertex:Hl,dithering_fragment:Vl,dithering_pars_fragment:kl,roughnessmap_fragment:zl,roughnessmap_pars_fragment:Wl,shadowmap_pars_fragment:Xl,shadowmap_pars_vertex:Kl,shadowmap_vertex:ql,shadowmask_pars_fragment:Yl,skinbase_vertex:jl,skinning_pars_vertex:$l,skinning_vertex:Zl,skinnormal_vertex:Ql,specularmap_fragment:Jl,specularmap_pars_fragment:ef,tonemapping_fragment:tf,tonemapping_pars_fragment:nf,transmission_fragment:rf,transmission_pars_fragment:af,uv_pars_fragment:of,uv_pars_vertex:sf,uv_vertex:cf,worldpos_vertex:lf,background_vert:ff,background_frag:uf,backgroundCube_vert:df,backgroundCube_frag:pf,cube_vert:hf,cube_frag:mf,depth_vert:_f,depth_frag:gf,distance_vert:vf,distance_frag:Sf,equirect_vert:Ef,equirect_frag:xf,linedashed_vert:Tf,linedashed_frag:Mf,meshbasic_vert:Af,meshbasic_frag:Rf,meshlambert_vert:bf,meshlambert_frag:Cf,meshmatcap_vert:Pf,meshmatcap_frag:wf,meshnormal_vert:Lf,meshnormal_frag:yf,meshphong_vert:If,meshphong_frag:Df,meshphysical_vert:Uf,meshphysical_frag:Nf,meshtoon_vert:Ff,meshtoon_frag:Of,points_vert:Bf,points_frag:Gf,shadow_vert:Hf,shadow_frag:Vf,sprite_vert:kf,sprite_frag:zf},ae={common:{diffuse:{value:new De(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},envMapRotation:{value:new He},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new vt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new De(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new De(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new De(16777215)},opacity:{value:1},center:{value:new vt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},Ot={basic:{uniforms:Mt([ae.common,ae.specularmap,ae.envmap,ae.aomap,ae.lightmap,ae.fog]),vertexShader:Ie.meshbasic_vert,fragmentShader:Ie.meshbasic_frag},lambert:{uniforms:Mt([ae.common,ae.specularmap,ae.envmap,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.fog,ae.lights,{emissive:{value:new De(0)},envMapIntensity:{value:1}}]),vertexShader:Ie.meshlambert_vert,fragmentShader:Ie.meshlambert_frag},phong:{uniforms:Mt([ae.common,ae.specularmap,ae.envmap,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.fog,ae.lights,{emissive:{value:new De(0)},specular:{value:new De(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphong_vert,fragmentShader:Ie.meshphong_frag},standard:{uniforms:Mt([ae.common,ae.envmap,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.roughnessmap,ae.metalnessmap,ae.fog,ae.lights,{emissive:{value:new De(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag},toon:{uniforms:Mt([ae.common,ae.aomap,ae.lightmap,ae.emissivemap,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.gradientmap,ae.fog,ae.lights,{emissive:{value:new De(0)}}]),vertexShader:Ie.meshtoon_vert,fragmentShader:Ie.meshtoon_frag},matcap:{uniforms:Mt([ae.common,ae.bumpmap,ae.normalmap,ae.displacementmap,ae.fog,{matcap:{value:null}}]),vertexShader:Ie.meshmatcap_vert,fragmentShader:Ie.meshmatcap_frag},points:{uniforms:Mt([ae.points,ae.fog]),vertexShader:Ie.points_vert,fragmentShader:Ie.points_frag},dashed:{uniforms:Mt([ae.common,ae.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ie.linedashed_vert,fragmentShader:Ie.linedashed_frag},depth:{uniforms:Mt([ae.common,ae.displacementmap]),vertexShader:Ie.depth_vert,fragmentShader:Ie.depth_frag},normal:{uniforms:Mt([ae.common,ae.bumpmap,ae.normalmap,ae.displacementmap,{opacity:{value:1}}]),vertexShader:Ie.meshnormal_vert,fragmentShader:Ie.meshnormal_frag},sprite:{uniforms:Mt([ae.sprite,ae.fog]),vertexShader:Ie.sprite_vert,fragmentShader:Ie.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ie.background_vert,fragmentShader:Ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new He}},vertexShader:Ie.backgroundCube_vert,fragmentShader:Ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ie.cube_vert,fragmentShader:Ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ie.equirect_vert,fragmentShader:Ie.equirect_frag},distance:{uniforms:Mt([ae.common,ae.displacementmap,{referencePosition:{value:new Re},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ie.distance_vert,fragmentShader:Ie.distance_frag},shadow:{uniforms:Mt([ae.lights,ae.fog,{color:{value:new De(0)},opacity:{value:1}}]),vertexShader:Ie.shadow_vert,fragmentShader:Ie.shadow_frag}};Ot.physical={uniforms:Mt([Ot.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new vt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new De(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new vt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new De(0)},specularColor:{value:new De(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new vt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag};const Zn={r:0,b:0,g:0},ln=new Xt,Wf=new ke;function Xf(n,t,e,i,r,a){const o=new De(0);let s=r===!0?0:1,c,l,d=null,u=0,f=null;function _(T){let M=T.isScene===!0?T.background:null;if(M&&M.isTexture){const A=T.backgroundBlurriness>0;M=t.get(M,A)}return M}function S(T){let M=!1;const A=_(T);A===null?m(o,s):A&&A.isColor&&(m(A,1),M=!0);const I=n.xr.getEnvironmentBlendMode();I==="additive"?e.buffers.color.setClear(0,0,0,1,a):I==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,a),(n.autoClear||M)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function R(T,M){const A=_(M);A&&(A.isCubeTexture||A.mapping===fi)?(l===void 0&&(l=new It(new ji(1,1,1),new jt({name:"BackgroundCubeMaterial",uniforms:Ni(Ot.backgroundCube.uniforms),vertexShader:Ot.backgroundCube.vertexShader,fragmentShader:Ot.backgroundCube.fragmentShader,side:Rt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(I,P,D){this.matrixWorld.copyPosition(D.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),ln.copy(M.backgroundRotation),ln.x*=-1,ln.y*=-1,ln.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(ln.y*=-1,ln.z*=-1),l.material.uniforms.envMap.value=A,l.material.uniforms.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,l.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Wf.makeRotationFromEuler(ln)),l.material.toneMapped=ze.getTransfer(A.colorSpace)!==tt,(d!==A||u!==A.version||f!==n.toneMapping)&&(l.material.needsUpdate=!0,d=A,u=A.version,f=n.toneMapping),l.layers.enableAll(),T.unshift(l,l.geometry,l.material,0,0,null)):A&&A.isTexture&&(c===void 0&&(c=new It(new Ua(2,2),new jt({name:"BackgroundMaterial",uniforms:Ni(Ot.background.uniforms),vertexShader:Ot.background.vertexShader,fragmentShader:Ot.background.fragmentShader,side:Cn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=A,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=ze.getTransfer(A.colorSpace)!==tt,A.matrixAutoUpdate===!0&&A.updateMatrix(),c.material.uniforms.uvTransform.value.copy(A.matrix),(d!==A||u!==A.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,d=A,u=A.version,f=n.toneMapping),c.layers.enableAll(),T.unshift(c,c.geometry,c.material,0,0,null))}function m(T,M){T.getRGB(Zn,Oa(n)),e.buffers.color.setClear(Zn.r,Zn.g,Zn.b,M,a)}function h(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(T,M=1){o.set(T),s=M,m(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(T){s=T,m(o,s)},render:S,addToRenderList:R,dispose:h}}function Kf(n,t){const e=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=f(null);let a=r,o=!1;function s(C,G,k,z,K){let F=!1;const O=u(C,z,k,G);a!==O&&(a=O,l(a.object)),F=_(C,z,k,K),F&&S(C,z,k,K),K!==null&&t.update(K,n.ELEMENT_ARRAY_BUFFER),(F||o)&&(o=!1,A(C,G,k,z),K!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(K).buffer))}function c(){return n.createVertexArray()}function l(C){return n.bindVertexArray(C)}function d(C){return n.deleteVertexArray(C)}function u(C,G,k,z){const K=z.wireframe===!0;let F=i[G.id];F===void 0&&(F={},i[G.id]=F);const O=C.isInstancedMesh===!0?C.id:0;let ne=F[O];ne===void 0&&(ne={},F[O]=ne);let ee=ne[k.id];ee===void 0&&(ee={},ne[k.id]=ee);let Te=ee[K];return Te===void 0&&(Te=f(c()),ee[K]=Te),Te}function f(C){const G=[],k=[],z=[];for(let K=0;K<e;K++)G[K]=0,k[K]=0,z[K]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:G,enabledAttributes:k,attributeDivisors:z,object:C,attributes:{},index:null}}function _(C,G,k,z){const K=a.attributes,F=G.attributes;let O=0;const ne=k.getAttributes();for(const ee in ne)if(ne[ee].location>=0){const Ae=K[ee];let ue=F[ee];if(ue===void 0&&(ee==="instanceMatrix"&&C.instanceMatrix&&(ue=C.instanceMatrix),ee==="instanceColor"&&C.instanceColor&&(ue=C.instanceColor)),Ae===void 0||Ae.attribute!==ue||ue&&Ae.data!==ue.data)return!0;O++}return a.attributesNum!==O||a.index!==z}function S(C,G,k,z){const K={},F=G.attributes;let O=0;const ne=k.getAttributes();for(const ee in ne)if(ne[ee].location>=0){let Ae=F[ee];Ae===void 0&&(ee==="instanceMatrix"&&C.instanceMatrix&&(Ae=C.instanceMatrix),ee==="instanceColor"&&C.instanceColor&&(Ae=C.instanceColor));const ue={};ue.attribute=Ae,Ae&&Ae.data&&(ue.data=Ae.data),K[ee]=ue,O++}a.attributes=K,a.attributesNum=O,a.index=z}function R(){const C=a.newAttributes;for(let G=0,k=C.length;G<k;G++)C[G]=0}function m(C){h(C,0)}function h(C,G){const k=a.newAttributes,z=a.enabledAttributes,K=a.attributeDivisors;k[C]=1,z[C]===0&&(n.enableVertexAttribArray(C),z[C]=1),K[C]!==G&&(n.vertexAttribDivisor(C,G),K[C]=G)}function T(){const C=a.newAttributes,G=a.enabledAttributes;for(let k=0,z=G.length;k<z;k++)G[k]!==C[k]&&(n.disableVertexAttribArray(k),G[k]=0)}function M(C,G,k,z,K,F,O){O===!0?n.vertexAttribIPointer(C,G,k,K,F):n.vertexAttribPointer(C,G,k,z,K,F)}function A(C,G,k,z){R();const K=z.attributes,F=k.getAttributes(),O=G.defaultAttributeValues;for(const ne in F){const ee=F[ne];if(ee.location>=0){let Te=K[ne];if(Te===void 0&&(ne==="instanceMatrix"&&C.instanceMatrix&&(Te=C.instanceMatrix),ne==="instanceColor"&&C.instanceColor&&(Te=C.instanceColor)),Te!==void 0){const Ae=Te.normalized,ue=Te.itemSize,Le=t.get(Te);if(Le===void 0)continue;const nt=Le.buffer,qe=Le.type,W=Le.bytesPerElement,Z=qe===n.INT||qe===n.UNSIGNED_INT||Te.gpuType===Na;if(Te.isInterleavedBufferAttribute){const te=Te.data,Pe=te.stride,Me=Te.offset;if(te.isInstancedInterleavedBuffer){for(let be=0;be<ee.locationSize;be++)h(ee.location+be,te.meshPerAttribute);C.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let be=0;be<ee.locationSize;be++)m(ee.location+be);n.bindBuffer(n.ARRAY_BUFFER,nt);for(let be=0;be<ee.locationSize;be++)M(ee.location+be,ue/ee.locationSize,qe,Ae,Pe*W,(Me+ue/ee.locationSize*be)*W,Z)}else{if(Te.isInstancedBufferAttribute){for(let te=0;te<ee.locationSize;te++)h(ee.location+te,Te.meshPerAttribute);C.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=Te.meshPerAttribute*Te.count)}else for(let te=0;te<ee.locationSize;te++)m(ee.location+te);n.bindBuffer(n.ARRAY_BUFFER,nt);for(let te=0;te<ee.locationSize;te++)M(ee.location+te,ue/ee.locationSize,qe,Ae,ue*W,ue/ee.locationSize*te*W,Z)}}else if(O!==void 0){const Ae=O[ne];if(Ae!==void 0)switch(Ae.length){case 2:n.vertexAttrib2fv(ee.location,Ae);break;case 3:n.vertexAttrib3fv(ee.location,Ae);break;case 4:n.vertexAttrib4fv(ee.location,Ae);break;default:n.vertexAttrib1fv(ee.location,Ae)}}}}T()}function I(){x();for(const C in i){const G=i[C];for(const k in G){const z=G[k];for(const K in z){const F=z[K];for(const O in F)d(F[O].object),delete F[O];delete z[K]}}delete i[C]}}function P(C){if(i[C.id]===void 0)return;const G=i[C.id];for(const k in G){const z=G[k];for(const K in z){const F=z[K];for(const O in F)d(F[O].object),delete F[O];delete z[K]}}delete i[C.id]}function D(C){for(const G in i){const k=i[G];for(const z in k){const K=k[z];if(K[C.id]===void 0)continue;const F=K[C.id];for(const O in F)d(F[O].object),delete F[O];delete K[C.id]}}}function v(C){for(const G in i){const k=i[G],z=C.isInstancedMesh===!0?C.id:0,K=k[z];if(K!==void 0){for(const F in K){const O=K[F];for(const ne in O)d(O[ne].object),delete O[ne];delete K[F]}delete k[z],Object.keys(k).length===0&&delete i[G]}}}function x(){q(),o=!0,a!==r&&(a=r,l(a.object))}function q(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:s,reset:x,resetDefaultState:q,dispose:I,releaseStatesOfGeometry:P,releaseStatesOfObject:v,releaseStatesOfProgram:D,initAttributes:R,enableAttribute:m,disableUnusedAttributes:T}}function qf(n,t,e){let i;function r(l){i=l}function a(l,d){n.drawArrays(i,l,d),e.update(d,i,1)}function o(l,d,u){u!==0&&(n.drawArraysInstanced(i,l,d,u),e.update(d,i,u))}function s(l,d,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,d,0,u);let _=0;for(let S=0;S<u;S++)_+=d[S];e.update(_,i,1)}function c(l,d,u,f){if(u===0)return;const _=t.get("WEBGL_multi_draw");if(_===null)for(let S=0;S<l.length;S++)o(l[S],d[S],f[S]);else{_.multiDrawArraysInstancedWEBGL(i,l,0,d,0,f,0,u);let S=0;for(let R=0;R<u;R++)S+=d[R]*f[R];e.update(S,i,1)}}this.setMode=r,this.render=a,this.renderInstances=o,this.renderMultiDraw=s,this.renderMultiDrawInstances=c}function Yf(n,t,e,i){let r;function a(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const D=t.get("EXT_texture_filter_anisotropic");r=n.getParameter(D.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(D){return!(D!==Kt&&i.convert(D)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function s(D){const v=D===on&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(D!==Bt&&i.convert(D)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&D!==nn&&!v)}function c(D){if(D==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";D="mediump"}return D==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const d=c(l);d!==l&&(Qe("WebGLRenderer:",l,"not supported, using",d,"instead."),l=d);const u=e.logarithmicDepthBuffer===!0,f=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),_=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),R=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),h=n.getParameter(n.MAX_VERTEX_ATTRIBS),T=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),M=n.getParameter(n.MAX_VARYING_VECTORS),A=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),I=n.getParameter(n.MAX_SAMPLES),P=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:u,reversedDepthBuffer:f,maxTextures:_,maxVertexTextures:S,maxTextureSize:R,maxCubemapSize:m,maxAttributes:h,maxVertexUniforms:T,maxVaryings:M,maxFragmentUniforms:A,maxSamples:I,samples:P}}function jf(n){const t=this;let e=null,i=0,r=!1,a=!1;const o=new ls,s=new He,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){const _=u.length!==0||f||i!==0||r;return r=f,i=u.length,_},this.beginShadows=function(){a=!0,d(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(u,f){e=d(u,f,0)},this.setState=function(u,f,_){const S=u.clippingPlanes,R=u.clipIntersection,m=u.clipShadows,h=n.get(u);if(!r||S===null||S.length===0||a&&!m)a?d(null):l();else{const T=a?0:i,M=T*4;let A=h.clippingState||null;c.value=A,A=d(S,f,M,_);for(let I=0;I!==M;++I)A[I]=e[I];h.clippingState=A,this.numIntersection=R?this.numPlanes:0,this.numPlanes+=T}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function d(u,f,_,S){const R=u!==null?u.length:0;let m=null;if(R!==0){if(m=c.value,S!==!0||m===null){const h=_+R*4,T=f.matrixWorldInverse;s.getNormalMatrix(T),(m===null||m.length<h)&&(m=new Float32Array(h));for(let M=0,A=_;M!==R;++M,A+=4)o.copy(u[M]).applyMatrix4(T,s),o.normal.toArray(m,A),m[A+3]=o.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=R,t.numIntersection=0,m}}const rn=4,qr=[.125,.215,.35,.446,.526,.582],dn=20,$f=256,Un=new Ki,Yr=new De;let Ti=null,Mi=0,Ai=0,Ri=!1;const Zf=new Re;class jr{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,i=.1,r=100,a={}){const{size:o=256,position:s=Zf}=a;Ti=this._renderer.getRenderTarget(),Mi=this._renderer.getActiveCubeFace(),Ai=this._renderer.getActiveMipmapLevel(),Ri=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,i,r,c,s),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Qr(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Zr(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Ti,Mi,Ai),this._renderer.xr.enabled=Ri,t.scissorTest=!1,gn(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Wn||t.mapping===yn?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Ti=this._renderer.getRenderTarget(),Mi=this._renderer.getActiveCubeFace(),Ai=this._renderer.getActiveMipmapLevel(),Ri=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:xt,minFilter:xt,generateMipmaps:!1,type:on,format:Kt,colorSpace:bt,depthBuffer:!1},r=$r(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=$r(t,e,i);const{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Qf(a)),this._blurMaterial=eu(a,t,e),this._ggxMaterial=Jf(a,t,e)}return r}_compileMaterial(t){const e=new It(new an,t);this._renderer.compile(e,Un)}_sceneToCubeUV(t,e,i,r,a){const c=new An(90,1,e,i),l=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,_=u.toneMapping;u.getClearColor(Yr),u.toneMapping=Ht,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(r),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new It(new ji,new xn({name:"PMREM.Background",side:Rt,depthWrite:!1,depthTest:!1})));const R=this._backgroundBox,m=R.material;let h=!1;const T=t.background;T?T.isColor&&(m.color.copy(T),t.background=null,h=!0):(m.color.copy(Yr),h=!0);for(let M=0;M<6;M++){const A=M%3;A===0?(c.up.set(0,l[M],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x+d[M],a.y,a.z)):A===1?(c.up.set(0,0,l[M]),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y+d[M],a.z)):(c.up.set(0,l[M],0),c.position.set(a.x,a.y,a.z),c.lookAt(a.x,a.y,a.z+d[M]));const I=this._cubeSize;gn(r,A*I,M>2?I:0,I,I),u.setRenderTarget(r),h&&u.render(R,c),u.render(t,c)}u.toneMapping=_,u.autoClear=f,t.background=T}_textureToCubeUV(t,e){const i=this._renderer,r=t.mapping===Wn||t.mapping===yn;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Qr()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Zr());const a=r?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=a;const s=a.uniforms;s.envMap.value=t;const c=this._cubeSize;gn(e,0,0,3*c,2*c),i.setRenderTarget(e),i.render(o,Un)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;const r=this._lodMeshes.length;for(let a=1;a<r;a++)this._applyGGXFilter(t,a-1,a);e.autoClear=i}_applyGGXFilter(t,e,i){const r=this._renderer,a=this._pingPongRenderTarget,o=this._ggxMaterial,s=this._lodMeshes[i];s.material=o;const c=o.uniforms,l=i/(this._lodMeshes.length-1),d=e/(this._lodMeshes.length-1),u=Math.sqrt(l*l-d*d),f=0+l*1.25,_=u*f,{_lodMax:S}=this,R=this._sizeLods[i],m=3*R*(i>S-rn?i-S+rn:0),h=4*(this._cubeSize-R);c.envMap.value=t.texture,c.roughness.value=_,c.mipInt.value=S-e,gn(a,m,h,3*R,2*R),r.setRenderTarget(a),r.render(s,Un),c.envMap.value=a.texture,c.roughness.value=0,c.mipInt.value=S-i,gn(t,m,h,3*R,2*R),r.setRenderTarget(t),r.render(s,Un)}_blur(t,e,i,r,a){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,i,r,"latitudinal",a),this._halfBlur(o,t,i,i,r,"longitudinal",a)}_halfBlur(t,e,i,r,a,o,s){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&it("blur direction must be either latitudinal or longitudinal!");const d=3,u=this._lodMeshes[r];u.material=l;const f=l.uniforms,_=this._sizeLods[i]-1,S=isFinite(a)?Math.PI/(2*_):2*Math.PI/(2*dn-1),R=a/S,m=isFinite(a)?1+Math.floor(d*R):dn;m>dn&&Qe(`sigmaRadians, ${a}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${dn}`);const h=[];let T=0;for(let D=0;D<dn;++D){const v=D/R,x=Math.exp(-v*v/2);h.push(x),D===0?T+=x:D<m&&(T+=2*x)}for(let D=0;D<h.length;D++)h[D]=h[D]/T;f.envMap.value=t.texture,f.samples.value=m,f.weights.value=h,f.latitudinal.value=o==="latitudinal",s&&(f.poleAxis.value=s);const{_lodMax:M}=this;f.dTheta.value=S,f.mipInt.value=M-i;const A=this._sizeLods[r],I=3*A*(r>M-rn?r-M+rn:0),P=4*(this._cubeSize-A);gn(e,I,P,3*A,2*A),c.setRenderTarget(e),c.render(u,Un)}}function Qf(n){const t=[],e=[],i=[];let r=n;const a=n-rn+1+qr.length;for(let o=0;o<a;o++){const s=Math.pow(2,r);t.push(s);let c=1/s;o>n-rn?c=qr[o-n+rn-1]:o===0&&(c=0),e.push(c);const l=1/(s-2),d=-l,u=1+l,f=[d,d,u,d,u,u,d,d,u,u,d,u],_=6,S=6,R=3,m=2,h=1,T=new Float32Array(R*S*_),M=new Float32Array(m*S*_),A=new Float32Array(h*S*_);for(let P=0;P<_;P++){const D=P%3*2/3-1,v=P>2?0:-1,x=[D,v,0,D+2/3,v,0,D+2/3,v+1,0,D,v,0,D+2/3,v+1,0,D,v+1,0];T.set(x,R*S*P),M.set(f,m*S*P);const q=[P,P,P,P,P,P];A.set(q,h*S*P)}const I=new an;I.setAttribute("position",new pn(T,R)),I.setAttribute("uv",new pn(M,m)),I.setAttribute("faceIndex",new pn(A,h)),i.push(new It(I,null)),r>rn&&r--}return{lodMeshes:i,sizeLods:t,sigmas:e}}function $r(n,t,e){const i=new Vt(n,t,e);return i.texture.mapping=fi,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function gn(n,t,e,i,r){n.viewport.set(t,e,i,r),n.scissor.set(t,e,i,r)}function Jf(n,t,e){return new jt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:$f,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ui(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Yt,depthTest:!1,depthWrite:!1})}function eu(n,t,e){const i=new Float32Array(dn),r=new Re(0,1,0);return new jt({name:"SphericalGaussianBlur",defines:{n:dn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:ui(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Yt,depthTest:!1,depthWrite:!1})}function Zr(){return new jt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ui(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Yt,depthTest:!1,depthWrite:!1})}function Qr(){return new jt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ui(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Yt,depthTest:!1,depthWrite:!1})}function ui(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class oo extends Vt{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];this.texture=new Ba(r),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new ji(5,5,5),a=new jt({name:"CubemapFromEquirect",uniforms:Ni(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Rt,blending:Yt});a.uniforms.tEquirect.value=e;const o=new It(r,a),s=e.minFilter;return e.minFilter===tn&&(e.minFilter=xt),new Us(1,10,this).update(t,o),e.minFilter=s,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,i=!0,r=!0){const a=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,i,r);t.setRenderTarget(a)}}function tu(n){let t=new WeakMap,e=new WeakMap,i=null;function r(f,_=!1){return f==null?null:_?o(f):a(f)}function a(f){if(f&&f.isTexture){const _=f.mapping;if(_===ii||_===Ei)if(t.has(f)){const S=t.get(f).texture;return s(S,f.mapping)}else{const S=f.image;if(S&&S.height>0){const R=new oo(S.height);return R.fromEquirectangularTexture(n,f),t.set(f,R),f.addEventListener("dispose",l),s(R.texture,f.mapping)}else return null}}return f}function o(f){if(f&&f.isTexture){const _=f.mapping,S=_===ii||_===Ei,R=_===Wn||_===yn;if(S||R){let m=e.get(f);const h=m!==void 0?m.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==h)return i===null&&(i=new jr(n)),m=S?i.fromEquirectangular(f,m):i.fromCubemap(f,m),m.texture.pmremVersion=f.pmremVersion,e.set(f,m),m.texture;if(m!==void 0)return m.texture;{const T=f.image;return S&&T&&T.height>0||R&&T&&c(T)?(i===null&&(i=new jr(n)),m=S?i.fromEquirectangular(f):i.fromCubemap(f),m.texture.pmremVersion=f.pmremVersion,e.set(f,m),f.addEventListener("dispose",d),m.texture):null}}}return f}function s(f,_){return _===ii?f.mapping=Wn:_===Ei&&(f.mapping=yn),f}function c(f){let _=0;const S=6;for(let R=0;R<S;R++)f[R]!==void 0&&_++;return _===S}function l(f){const _=f.target;_.removeEventListener("dispose",l);const S=t.get(_);S!==void 0&&(t.delete(_),S.dispose())}function d(f){const _=f.target;_.removeEventListener("dispose",d);const S=e.get(_);S!==void 0&&(e.delete(_),S.dispose())}function u(){t=new WeakMap,e=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:u}}function nu(n){const t={};function e(i){if(t[i]!==void 0)return t[i];const r=n.getExtension(i);return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){const r=e(i);return r===null&&Ra("WebGLRenderer: "+i+" extension not supported."),r}}}function iu(n,t,e,i){const r={},a=new WeakMap;function o(u){const f=u.target;f.index!==null&&t.remove(f.index);for(const S in f.attributes)t.remove(f.attributes[S]);f.removeEventListener("dispose",o),delete r[f.id];const _=a.get(f);_&&(t.remove(_),a.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function s(u,f){return r[f.id]===!0||(f.addEventListener("dispose",o),r[f.id]=!0,e.memory.geometries++),f}function c(u){const f=u.attributes;for(const _ in f)t.update(f[_],n.ARRAY_BUFFER)}function l(u){const f=[],_=u.index,S=u.attributes.position;let R=0;if(S===void 0)return;if(_!==null){const T=_.array;R=_.version;for(let M=0,A=T.length;M<A;M+=3){const I=T[M+0],P=T[M+1],D=T[M+2];f.push(I,P,P,D,D,I)}}else{const T=S.array;R=S.version;for(let M=0,A=T.length/3-1;M<A;M+=3){const I=M+0,P=M+1,D=M+2;f.push(I,P,P,D,D,I)}}const m=new(S.count>=65535?Ns:qa)(f,1);m.version=R;const h=a.get(u);h&&t.remove(h),a.set(u,m)}function d(u){const f=a.get(u);if(f){const _=u.index;_!==null&&f.version<_.version&&l(u)}else l(u);return a.get(u)}return{get:s,update:c,getWireframeAttribute:d}}function ru(n,t,e){let i;function r(f){i=f}let a,o;function s(f){a=f.type,o=f.bytesPerElement}function c(f,_){n.drawElements(i,_,a,f*o),e.update(_,i,1)}function l(f,_,S){S!==0&&(n.drawElementsInstanced(i,_,a,f*o,S),e.update(_,i,S))}function d(f,_,S){if(S===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,_,0,a,f,0,S);let m=0;for(let h=0;h<S;h++)m+=_[h];e.update(m,i,1)}function u(f,_,S,R){if(S===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let h=0;h<f.length;h++)l(f[h]/o,_[h],R[h]);else{m.multiDrawElementsInstancedWEBGL(i,_,0,a,f,0,R,0,S);let h=0;for(let T=0;T<S;T++)h+=_[T]*R[T];e.update(h,i,1)}}this.setMode=r,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=d,this.renderMultiDrawInstances=u}function au(n){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,s){switch(e.calls++,o){case n.TRIANGLES:e.triangles+=s*(a/3);break;case n.LINES:e.lines+=s*(a/2);break;case n.LINE_STRIP:e.lines+=s*(a-1);break;case n.LINE_LOOP:e.lines+=s*a;break;case n.POINTS:e.points+=s*a;break;default:it("WebGLInfo: Unknown draw mode:",o);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function ou(n,t,e){const i=new WeakMap,r=new pt;function a(o,s,c){const l=o.morphTargetInfluences,d=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,u=d!==void 0?d.length:0;let f=i.get(s);if(f===void 0||f.count!==u){let x=function(){D.dispose(),i.delete(s),s.removeEventListener("dispose",x)};f!==void 0&&f.texture.dispose();const _=s.morphAttributes.position!==void 0,S=s.morphAttributes.normal!==void 0,R=s.morphAttributes.color!==void 0,m=s.morphAttributes.position||[],h=s.morphAttributes.normal||[],T=s.morphAttributes.color||[];let M=0;_===!0&&(M=1),S===!0&&(M=2),R===!0&&(M=3);let A=s.attributes.position.count*M,I=1;A>t.maxTextureSize&&(I=Math.ceil(A/t.maxTextureSize),A=t.maxTextureSize);const P=new Float32Array(A*I*4*u),D=new Fa(P,A,I,u);D.type=nn,D.needsUpdate=!0;const v=M*4;for(let q=0;q<u;q++){const C=m[q],G=h[q],k=T[q],z=A*I*4*q;for(let K=0;K<C.count;K++){const F=K*v;_===!0&&(r.fromBufferAttribute(C,K),P[z+F+0]=r.x,P[z+F+1]=r.y,P[z+F+2]=r.z,P[z+F+3]=0),S===!0&&(r.fromBufferAttribute(G,K),P[z+F+4]=r.x,P[z+F+5]=r.y,P[z+F+6]=r.z,P[z+F+7]=0),R===!0&&(r.fromBufferAttribute(k,K),P[z+F+8]=r.x,P[z+F+9]=r.y,P[z+F+10]=r.z,P[z+F+11]=k.itemSize===4?r.w:1)}}f={count:u,texture:D,size:new vt(A,I)},i.set(s,f),s.addEventListener("dispose",x)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",o.morphTexture,e);else{let _=0;for(let R=0;R<l.length;R++)_+=l[R];const S=s.morphTargetsRelative?1:1-_;c.getUniforms().setValue(n,"morphTargetBaseInfluence",S),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",f.texture,e),c.getUniforms().setValue(n,"morphTargetsTextureSize",f.size)}return{update:a}}function su(n,t,e,i,r){let a=new WeakMap;function o(l){const d=r.render.frame,u=l.geometry,f=t.get(l,u);if(a.get(f)!==d&&(t.update(f),a.set(f,d)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),a.get(l)!==d&&(e.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,n.ARRAY_BUFFER),a.set(l,d))),l.isSkinnedMesh){const _=l.skeleton;a.get(_)!==d&&(_.update(),a.set(_,d))}return f}function s(){a=new WeakMap}function c(l){const d=l.target;d.removeEventListener("dispose",c),i.releaseStatesOfObject(d),e.remove(d.instanceMatrix),d.instanceColor!==null&&e.remove(d.instanceColor)}return{update:o,dispose:s}}const cu={[Xa]:"LINEAR_TONE_MAPPING",[Wa]:"REINHARD_TONE_MAPPING",[za]:"CINEON_TONE_MAPPING",[ka]:"ACES_FILMIC_TONE_MAPPING",[Va]:"AGX_TONE_MAPPING",[Ha]:"NEUTRAL_TONE_MAPPING",[Ga]:"CUSTOM_TONE_MAPPING"};function lu(n,t,e,i,r){const a=new Vt(t,e,{type:n,depthBuffer:i,stencilBuffer:r}),o=new Vt(t,e,{type:on,depthBuffer:!1,stencilBuffer:!1}),s=new an;s.setAttribute("position",new en([-1,3,0,-1,-1,0,3,-1,0],3)),s.setAttribute("uv",new en([0,2,0,0,2,0],2));const c=new No({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),l=new It(s,c),d=new Ki(-1,1,1,-1,0,1);let u=null,f=null,_=!1,S,R=null,m=[],h=!1;this.setSize=function(T,M){a.setSize(T,M),o.setSize(T,M);for(let A=0;A<m.length;A++){const I=m[A];I.setSize&&I.setSize(T,M)}},this.setEffects=function(T){m=T,h=m.length>0&&m[0].isRenderPass===!0;const M=a.width,A=a.height;for(let I=0;I<m.length;I++){const P=m[I];P.setSize&&P.setSize(M,A)}},this.begin=function(T,M){if(_||T.toneMapping===Ht&&m.length===0)return!1;if(R=M,M!==null){const A=M.width,I=M.height;(a.width!==A||a.height!==I)&&this.setSize(A,I)}return h===!1&&T.setRenderTarget(a),S=T.toneMapping,T.toneMapping=Ht,!0},this.hasRenderPass=function(){return h},this.end=function(T,M){T.toneMapping=S,_=!0;let A=a,I=o;for(let P=0;P<m.length;P++){const D=m[P];if(D.enabled!==!1&&(D.render(T,I,A,M),D.needsSwap!==!1)){const v=A;A=I,I=v}}if(u!==T.outputColorSpace||f!==T.toneMapping){u=T.outputColorSpace,f=T.toneMapping,c.defines={},ze.getTransfer(u)===tt&&(c.defines.SRGB_TRANSFER="");const P=cu[f];P&&(c.defines[P]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=A.texture,T.setRenderTarget(R),T.render(l,d),R=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){a.dispose(),o.dispose(),s.dispose(),c.dispose()}}const so=new si,Vi=new ai(1,1),co=new Fa,lo=new Os,fo=new Ba,Jr=[],ea=[],ta=new Float32Array(16),na=new Float32Array(9),ia=new Float32Array(4);function In(n,t,e){const i=n[0];if(i<=0||i>0)return n;const r=t*e;let a=Jr[r];if(a===void 0&&(a=new Float32Array(r),Jr[r]=a),t!==0){i.toArray(a,0);for(let o=1,s=0;o!==t;++o)s+=e,n[o].toArray(a,s)}return a}function ht(n,t){if(n.length!==t.length)return!1;for(let e=0,i=n.length;e<i;e++)if(n[e]!==t[e])return!1;return!0}function mt(n,t){for(let e=0,i=t.length;e<i;e++)n[e]=t[e]}function di(n,t){let e=ea[t];e===void 0&&(e=new Int32Array(t),ea[t]=e);for(let i=0;i!==t;++i)e[i]=n.allocateTextureUnit();return e}function fu(n,t){const e=this.cache;e[0]!==t&&(n.uniform1f(this.addr,t),e[0]=t)}function uu(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ht(e,t))return;n.uniform2fv(this.addr,t),mt(e,t)}}function du(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(n.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ht(e,t))return;n.uniform3fv(this.addr,t),mt(e,t)}}function pu(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ht(e,t))return;n.uniform4fv(this.addr,t),mt(e,t)}}function hu(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(ht(e,t))return;n.uniformMatrix2fv(this.addr,!1,t),mt(e,t)}else{if(ht(e,i))return;ia.set(i),n.uniformMatrix2fv(this.addr,!1,ia),mt(e,i)}}function mu(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(ht(e,t))return;n.uniformMatrix3fv(this.addr,!1,t),mt(e,t)}else{if(ht(e,i))return;na.set(i),n.uniformMatrix3fv(this.addr,!1,na),mt(e,i)}}function _u(n,t){const e=this.cache,i=t.elements;if(i===void 0){if(ht(e,t))return;n.uniformMatrix4fv(this.addr,!1,t),mt(e,t)}else{if(ht(e,i))return;ta.set(i),n.uniformMatrix4fv(this.addr,!1,ta),mt(e,i)}}function gu(n,t){const e=this.cache;e[0]!==t&&(n.uniform1i(this.addr,t),e[0]=t)}function vu(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ht(e,t))return;n.uniform2iv(this.addr,t),mt(e,t)}}function Su(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ht(e,t))return;n.uniform3iv(this.addr,t),mt(e,t)}}function Eu(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ht(e,t))return;n.uniform4iv(this.addr,t),mt(e,t)}}function xu(n,t){const e=this.cache;e[0]!==t&&(n.uniform1ui(this.addr,t),e[0]=t)}function Tu(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(n.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ht(e,t))return;n.uniform2uiv(this.addr,t),mt(e,t)}}function Mu(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(n.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ht(e,t))return;n.uniform3uiv(this.addr,t),mt(e,t)}}function Au(n,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(n.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ht(e,t))return;n.uniform4uiv(this.addr,t),mt(e,t)}}function Ru(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let a;this.type===n.SAMPLER_2D_SHADOW?(Vi.compareFunction=e.isReversedDepthBuffer()?qi:Yi,a=Vi):a=so,e.setTexture2D(t||a,r)}function bu(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||lo,r)}function Cu(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTextureCube(t||fo,r)}function Pu(n,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||co,r)}function wu(n){switch(n){case 5126:return fu;case 35664:return uu;case 35665:return du;case 35666:return pu;case 35674:return hu;case 35675:return mu;case 35676:return _u;case 5124:case 35670:return gu;case 35667:case 35671:return vu;case 35668:case 35672:return Su;case 35669:case 35673:return Eu;case 5125:return xu;case 36294:return Tu;case 36295:return Mu;case 36296:return Au;case 35678:case 36198:case 36298:case 36306:case 35682:return Ru;case 35679:case 36299:case 36307:return bu;case 35680:case 36300:case 36308:case 36293:return Cu;case 36289:case 36303:case 36311:case 36292:return Pu}}function Lu(n,t){n.uniform1fv(this.addr,t)}function yu(n,t){const e=In(t,this.size,2);n.uniform2fv(this.addr,e)}function Iu(n,t){const e=In(t,this.size,3);n.uniform3fv(this.addr,e)}function Du(n,t){const e=In(t,this.size,4);n.uniform4fv(this.addr,e)}function Uu(n,t){const e=In(t,this.size,4);n.uniformMatrix2fv(this.addr,!1,e)}function Nu(n,t){const e=In(t,this.size,9);n.uniformMatrix3fv(this.addr,!1,e)}function Fu(n,t){const e=In(t,this.size,16);n.uniformMatrix4fv(this.addr,!1,e)}function Ou(n,t){n.uniform1iv(this.addr,t)}function Bu(n,t){n.uniform2iv(this.addr,t)}function Gu(n,t){n.uniform3iv(this.addr,t)}function Hu(n,t){n.uniform4iv(this.addr,t)}function Vu(n,t){n.uniform1uiv(this.addr,t)}function ku(n,t){n.uniform2uiv(this.addr,t)}function zu(n,t){n.uniform3uiv(this.addr,t)}function Wu(n,t){n.uniform4uiv(this.addr,t)}function Xu(n,t,e){const i=this.cache,r=t.length,a=di(e,r);ht(i,a)||(n.uniform1iv(this.addr,a),mt(i,a));let o;this.type===n.SAMPLER_2D_SHADOW?o=Vi:o=so;for(let s=0;s!==r;++s)e.setTexture2D(t[s]||o,a[s])}function Ku(n,t,e){const i=this.cache,r=t.length,a=di(e,r);ht(i,a)||(n.uniform1iv(this.addr,a),mt(i,a));for(let o=0;o!==r;++o)e.setTexture3D(t[o]||lo,a[o])}function qu(n,t,e){const i=this.cache,r=t.length,a=di(e,r);ht(i,a)||(n.uniform1iv(this.addr,a),mt(i,a));for(let o=0;o!==r;++o)e.setTextureCube(t[o]||fo,a[o])}function Yu(n,t,e){const i=this.cache,r=t.length,a=di(e,r);ht(i,a)||(n.uniform1iv(this.addr,a),mt(i,a));for(let o=0;o!==r;++o)e.setTexture2DArray(t[o]||co,a[o])}function ju(n){switch(n){case 5126:return Lu;case 35664:return yu;case 35665:return Iu;case 35666:return Du;case 35674:return Uu;case 35675:return Nu;case 35676:return Fu;case 5124:case 35670:return Ou;case 35667:case 35671:return Bu;case 35668:case 35672:return Gu;case 35669:case 35673:return Hu;case 5125:return Vu;case 36294:return ku;case 36295:return zu;case 36296:return Wu;case 35678:case 36198:case 36298:case 36306:case 35682:return Xu;case 35679:case 36299:case 36307:return Ku;case 35680:case 36300:case 36308:case 36293:return qu;case 36289:case 36303:case 36311:case 36292:return Yu}}class $u{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=wu(e.type)}}class Zu{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=ju(e.type)}}class Qu{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let a=0,o=r.length;a!==o;++a){const s=r[a];s.setValue(t,e[s.id],i)}}}const bi=/(\w+)(\])?(\[|\.)?/g;function ra(n,t){n.seq.push(t),n.map[t.id]=t}function Ju(n,t,e){const i=n.name,r=i.length;for(bi.lastIndex=0;;){const a=bi.exec(i),o=bi.lastIndex;let s=a[1];const c=a[2]==="]",l=a[3];if(c&&(s=s|0),l===void 0||l==="["&&o+2===r){ra(e,l===void 0?new $u(s,n,t):new Zu(s,n,t));break}else{let u=e.map[s];u===void 0&&(u=new Qu(s),ra(e,u)),e=u}}}class ri{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){const s=t.getActiveUniform(e,o),c=t.getUniformLocation(e,s.name);Ju(s,c,this)}const r=[],a=[];for(const o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?r.push(o):a.push(o);r.length>0&&(this.seq=r.concat(a))}setValue(t,e,i,r){const a=this.map[e];a!==void 0&&a.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let a=0,o=e.length;a!==o;++a){const s=e[a],c=i[s.id];c.needsUpdate!==!1&&s.setValue(t,c.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,a=t.length;r!==a;++r){const o=t[r];o.id in e&&i.push(o)}return i}}function aa(n,t,e){const i=n.createShader(t);return n.shaderSource(i,e),n.compileShader(i),i}const ed=37297;let td=0;function nd(n,t){const e=n.split(`
`),i=[],r=Math.max(t-6,0),a=Math.min(t+6,e.length);for(let o=r;o<a;o++){const s=o+1;i.push(`${s===t?">":" "} ${s}: ${e[o]}`)}return i.join(`
`)}const oa=new He;function id(n){ze._getMatrix(oa,ze.workingColorSpace,n);const t=`mat3( ${oa.elements.map(e=>e.toFixed(4))} )`;switch(ze.getTransfer(n)){case Ka:return[t,"LinearTransferOETF"];case tt:return[t,"sRGBTransferOETF"];default:return Qe("WebGLProgram: Unsupported color space: ",n),[t,"LinearTransferOETF"]}}function sa(n,t,e){const i=n.getShaderParameter(t,n.COMPILE_STATUS),a=(n.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";const o=/ERROR: 0:(\d+)/.exec(a);if(o){const s=parseInt(o[1]);return e.toUpperCase()+`

`+a+`

`+nd(n.getShaderSource(t),s)}else return a}function rd(n,t){const e=id(t);return[`vec4 ${n}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const ad={[Xa]:"Linear",[Wa]:"Reinhard",[za]:"Cineon",[ka]:"ACESFilmic",[Va]:"AgX",[Ha]:"Neutral",[Ga]:"Custom"};function od(n,t){const e=ad[t];return e===void 0?(Qe("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Qn=new Re;function sd(){ze.getLuminanceCoefficients(Qn);const n=Qn.x.toFixed(4),t=Qn.y.toFixed(4),e=Qn.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function cd(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Gn).join(`
`)}function ld(n){const t=[];for(const e in n){const i=n[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function fd(n,t){const e={},i=n.getProgramParameter(t,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=n.getActiveAttrib(t,r),o=a.name;let s=1;a.type===n.FLOAT_MAT2&&(s=2),a.type===n.FLOAT_MAT3&&(s=3),a.type===n.FLOAT_MAT4&&(s=4),e[o]={type:a.type,location:n.getAttribLocation(t,o),locationSize:s}}return e}function Gn(n){return n!==""}function ca(n,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function la(n,t){return n.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const ud=/^[ \t]*#include +<([\w\d./]+)>/gm;function ki(n){return n.replace(ud,pd)}const dd=new Map;function pd(n,t){let e=Ie[t];if(e===void 0){const i=dd.get(t);if(i!==void 0)e=Ie[i],Qe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("Can not resolve #include <"+t+">")}return ki(e)}const hd=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function fa(n){return n.replace(hd,md)}function md(n,t,e,i){let r="";for(let a=parseInt(t);a<parseInt(e);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function ua(n){let t=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?t+=`
#define HIGH_PRECISION`:n.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const _d={[ti]:"SHADOWMAP_TYPE_PCF",[Bn]:"SHADOWMAP_TYPE_VSM"};function gd(n){return _d[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const vd={[Wn]:"ENVMAP_TYPE_CUBE",[yn]:"ENVMAP_TYPE_CUBE",[fi]:"ENVMAP_TYPE_CUBE_UV"};function Sd(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":vd[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const Ed={[yn]:"ENVMAP_MODE_REFRACTION"};function xd(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Ed[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Td={[Vs]:"ENVMAP_BLENDING_MULTIPLY",[Hs]:"ENVMAP_BLENDING_MIX",[Gs]:"ENVMAP_BLENDING_ADD"};function Md(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Td[n.combine]||"ENVMAP_BLENDING_NONE"}function Ad(n){const t=n.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:i,maxMip:e}}function Rd(n,t,e,i){const r=n.getContext(),a=e.defines;let o=e.vertexShader,s=e.fragmentShader;const c=gd(e),l=Sd(e),d=xd(e),u=Md(e),f=Ad(e),_=cd(e),S=ld(a),R=r.createProgram();let m,h,T=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,S].filter(Gn).join(`
`),m.length>0&&(m+=`
`),h=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,S].filter(Gn).join(`
`),h.length>0&&(h+=`
`)):(m=[ua(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,S,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+d:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Gn).join(`
`),h=[ua(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,S,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+d:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ht?"#define TONE_MAPPING":"",e.toneMapping!==Ht?Ie.tonemapping_pars_fragment:"",e.toneMapping!==Ht?od("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ie.colorspace_pars_fragment,rd("linearToOutputTexel",e.outputColorSpace),sd(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Gn).join(`
`)),o=ki(o),o=ca(o,e),o=la(o,e),s=ki(s),s=ca(s,e),s=la(s,e),o=fa(o),s=fa(s),e.isRawShaderMaterial!==!0&&(T=`#version 300 es
`,m=[_,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,h=["#define varying in",e.glslVersion===Kr?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Kr?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);const M=T+m+o,A=T+h+s,I=aa(r,r.VERTEX_SHADER,M),P=aa(r,r.FRAGMENT_SHADER,A);r.attachShader(R,I),r.attachShader(R,P),e.index0AttributeName!==void 0?r.bindAttribLocation(R,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(R,0,"position"),r.linkProgram(R);function D(C){if(n.debug.checkShaderErrors){const G=r.getProgramInfoLog(R)||"",k=r.getShaderInfoLog(I)||"",z=r.getShaderInfoLog(P)||"",K=G.trim(),F=k.trim(),O=z.trim();let ne=!0,ee=!0;if(r.getProgramParameter(R,r.LINK_STATUS)===!1)if(ne=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,R,I,P);else{const Te=sa(r,I,"vertex"),Ae=sa(r,P,"fragment");it("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(R,r.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+K+`
`+Te+`
`+Ae)}else K!==""?Qe("WebGLProgram: Program Info Log:",K):(F===""||O==="")&&(ee=!1);ee&&(C.diagnostics={runnable:ne,programLog:K,vertexShader:{log:F,prefix:m},fragmentShader:{log:O,prefix:h}})}r.deleteShader(I),r.deleteShader(P),v=new ri(r,R),x=fd(r,R)}let v;this.getUniforms=function(){return v===void 0&&D(this),v};let x;this.getAttributes=function(){return x===void 0&&D(this),x};let q=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return q===!1&&(q=r.getProgramParameter(R,ed)),q},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(R),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=td++,this.cacheKey=t,this.usedTimes=1,this.program=R,this.vertexShader=I,this.fragmentShader=P,this}let bd=0;class Cd{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,i=t.fragmentShader,r=this._getShaderStage(e),a=this._getShaderStage(i),o=this._getShaderCacheForMaterial(t);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(a)===!1&&(o.add(a),a.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new Pd(t),e.set(t,i)),i}}class Pd{constructor(t){this.id=bd++,this.code=t,this.usedTimes=0}}function wd(n,t,e,i,r,a){const o=new Fs,s=new Cd,c=new Set,l=[],d=new Map,u=i.logarithmicDepthBuffer;let f=i.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function S(v){return c.add(v),v===0?"uv":`uv${v}`}function R(v,x,q,C,G){const k=C.fog,z=G.geometry,K=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?C.environment:null,F=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,O=t.get(v.envMap||K,F),ne=O&&O.mapping===fi?O.image.height:null,ee=_[v.type];v.precision!==null&&(f=i.getMaxPrecision(v.precision),f!==v.precision&&Qe("WebGLProgram.getParameters:",v.precision,"not supported, using",f,"instead."));const Te=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,Ae=Te!==void 0?Te.length:0;let ue=0;z.morphAttributes.position!==void 0&&(ue=1),z.morphAttributes.normal!==void 0&&(ue=2),z.morphAttributes.color!==void 0&&(ue=3);let Le,nt,qe,W;if(ee){const Ke=Ot[ee];Le=Ke.vertexShader,nt=Ke.fragmentShader}else Le=v.vertexShader,nt=v.fragmentShader,s.update(v),qe=s.getVertexShaderID(v),W=s.getFragmentShaderID(v);const Z=n.getRenderTarget(),te=n.state.buffers.depth.getReversed(),Pe=G.isInstancedMesh===!0,Me=G.isBatchedMesh===!0,be=!!v.map,ot=!!v.matcap,Ge=!!O,Xe=!!v.aoMap,$e=!!v.lightMap,Ue=!!v.bumpMap,st=!!v.normalMap,b=!!v.displacementMap,ut=!!v.emissiveMap,We=!!v.metalnessMap,Je=!!v.roughnessMap,ge=v.anisotropy>0,E=v.clearcoat>0,p=v.dispersion>0,L=v.iridescence>0,X=v.sheen>0,Y=v.transmission>0,V=ge&&!!v.anisotropyMap,de=E&&!!v.clearcoatMap,ie=E&&!!v.clearcoatNormalMap,xe=E&&!!v.clearcoatRoughnessMap,Ce=L&&!!v.iridescenceMap,j=L&&!!v.iridescenceThicknessMap,Q=X&&!!v.sheenColorMap,pe=X&&!!v.sheenRoughnessMap,me=!!v.specularMap,ce=!!v.specularColorMap,Ne=!!v.specularIntensityMap,w=Y&&!!v.transmissionMap,re=Y&&!!v.thicknessMap,J=!!v.gradientMap,fe=!!v.alphaMap,$=v.alphaTest>0,H=!!v.alphaHash,he=!!v.extensions;let we=Ht;v.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(we=n.toneMapping);const et={shaderID:ee,shaderType:v.type,shaderName:v.name,vertexShader:Le,fragmentShader:nt,defines:v.defines,customVertexShaderID:qe,customFragmentShaderID:W,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:f,batching:Me,batchingColor:Me&&G._colorsTexture!==null,instancing:Pe,instancingColor:Pe&&G.instanceColor!==null,instancingMorph:Pe&&G.morphTexture!==null,outputColorSpace:Z===null?n.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:bt,alphaToCoverage:!!v.alphaToCoverage,map:be,matcap:ot,envMap:Ge,envMapMode:Ge&&O.mapping,envMapCubeUVHeight:ne,aoMap:Xe,lightMap:$e,bumpMap:Ue,normalMap:st,displacementMap:b,emissiveMap:ut,normalMapObjectSpace:st&&v.normalMapType===Ds,normalMapTangentSpace:st&&v.normalMapType===Is,metalnessMap:We,roughnessMap:Je,anisotropy:ge,anisotropyMap:V,clearcoat:E,clearcoatMap:de,clearcoatNormalMap:ie,clearcoatRoughnessMap:xe,dispersion:p,iridescence:L,iridescenceMap:Ce,iridescenceThicknessMap:j,sheen:X,sheenColorMap:Q,sheenRoughnessMap:pe,specularMap:me,specularColorMap:ce,specularIntensityMap:Ne,transmission:Y,transmissionMap:w,thicknessMap:re,gradientMap:J,opaque:v.transparent===!1&&v.blending===ni&&v.alphaToCoverage===!1,alphaMap:fe,alphaTest:$,alphaHash:H,combine:v.combine,mapUv:be&&S(v.map.channel),aoMapUv:Xe&&S(v.aoMap.channel),lightMapUv:$e&&S(v.lightMap.channel),bumpMapUv:Ue&&S(v.bumpMap.channel),normalMapUv:st&&S(v.normalMap.channel),displacementMapUv:b&&S(v.displacementMap.channel),emissiveMapUv:ut&&S(v.emissiveMap.channel),metalnessMapUv:We&&S(v.metalnessMap.channel),roughnessMapUv:Je&&S(v.roughnessMap.channel),anisotropyMapUv:V&&S(v.anisotropyMap.channel),clearcoatMapUv:de&&S(v.clearcoatMap.channel),clearcoatNormalMapUv:ie&&S(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:xe&&S(v.clearcoatRoughnessMap.channel),iridescenceMapUv:Ce&&S(v.iridescenceMap.channel),iridescenceThicknessMapUv:j&&S(v.iridescenceThicknessMap.channel),sheenColorMapUv:Q&&S(v.sheenColorMap.channel),sheenRoughnessMapUv:pe&&S(v.sheenRoughnessMap.channel),specularMapUv:me&&S(v.specularMap.channel),specularColorMapUv:ce&&S(v.specularColorMap.channel),specularIntensityMapUv:Ne&&S(v.specularIntensityMap.channel),transmissionMapUv:w&&S(v.transmissionMap.channel),thicknessMapUv:re&&S(v.thicknessMap.channel),alphaMapUv:fe&&S(v.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(st||ge),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!z.attributes.uv&&(be||fe),fog:!!k,useFog:v.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||z.attributes.normal===void 0&&st===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:te,skinning:G.isSkinnedMesh===!0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:Ae,morphTextureStride:ue,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:v.dithering,shadowMapEnabled:n.shadowMap.enabled&&q.length>0,shadowMapType:n.shadowMap.type,toneMapping:we,decodeVideoTexture:be&&v.map.isVideoTexture===!0&&ze.getTransfer(v.map.colorSpace)===tt,decodeVideoTextureEmissive:ut&&v.emissiveMap.isVideoTexture===!0&&ze.getTransfer(v.emissiveMap.colorSpace)===tt,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Gt,flipSided:v.side===Rt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:he&&v.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(he&&v.extensions.multiDraw===!0||Me)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return et.vertexUv1s=c.has(1),et.vertexUv2s=c.has(2),et.vertexUv3s=c.has(3),c.clear(),et}function m(v){const x=[];if(v.shaderID?x.push(v.shaderID):(x.push(v.customVertexShaderID),x.push(v.customFragmentShaderID)),v.defines!==void 0)for(const q in v.defines)x.push(q),x.push(v.defines[q]);return v.isRawShaderMaterial===!1&&(h(x,v),T(x,v),x.push(n.outputColorSpace)),x.push(v.customProgramCacheKey),x.join()}function h(v,x){v.push(x.precision),v.push(x.outputColorSpace),v.push(x.envMapMode),v.push(x.envMapCubeUVHeight),v.push(x.mapUv),v.push(x.alphaMapUv),v.push(x.lightMapUv),v.push(x.aoMapUv),v.push(x.bumpMapUv),v.push(x.normalMapUv),v.push(x.displacementMapUv),v.push(x.emissiveMapUv),v.push(x.metalnessMapUv),v.push(x.roughnessMapUv),v.push(x.anisotropyMapUv),v.push(x.clearcoatMapUv),v.push(x.clearcoatNormalMapUv),v.push(x.clearcoatRoughnessMapUv),v.push(x.iridescenceMapUv),v.push(x.iridescenceThicknessMapUv),v.push(x.sheenColorMapUv),v.push(x.sheenRoughnessMapUv),v.push(x.specularMapUv),v.push(x.specularColorMapUv),v.push(x.specularIntensityMapUv),v.push(x.transmissionMapUv),v.push(x.thicknessMapUv),v.push(x.combine),v.push(x.fogExp2),v.push(x.sizeAttenuation),v.push(x.morphTargetsCount),v.push(x.morphAttributeCount),v.push(x.numDirLights),v.push(x.numPointLights),v.push(x.numSpotLights),v.push(x.numSpotLightMaps),v.push(x.numHemiLights),v.push(x.numRectAreaLights),v.push(x.numDirLightShadows),v.push(x.numPointLightShadows),v.push(x.numSpotLightShadows),v.push(x.numSpotLightShadowsWithMaps),v.push(x.numLightProbes),v.push(x.shadowMapType),v.push(x.toneMapping),v.push(x.numClippingPlanes),v.push(x.numClipIntersection),v.push(x.depthPacking)}function T(v,x){o.disableAll(),x.instancing&&o.enable(0),x.instancingColor&&o.enable(1),x.instancingMorph&&o.enable(2),x.matcap&&o.enable(3),x.envMap&&o.enable(4),x.normalMapObjectSpace&&o.enable(5),x.normalMapTangentSpace&&o.enable(6),x.clearcoat&&o.enable(7),x.iridescence&&o.enable(8),x.alphaTest&&o.enable(9),x.vertexColors&&o.enable(10),x.vertexAlphas&&o.enable(11),x.vertexUv1s&&o.enable(12),x.vertexUv2s&&o.enable(13),x.vertexUv3s&&o.enable(14),x.vertexTangents&&o.enable(15),x.anisotropy&&o.enable(16),x.alphaHash&&o.enable(17),x.batching&&o.enable(18),x.dispersion&&o.enable(19),x.batchingColor&&o.enable(20),x.gradientMap&&o.enable(21),v.push(o.mask),o.disableAll(),x.fog&&o.enable(0),x.useFog&&o.enable(1),x.flatShading&&o.enable(2),x.logarithmicDepthBuffer&&o.enable(3),x.reversedDepthBuffer&&o.enable(4),x.skinning&&o.enable(5),x.morphTargets&&o.enable(6),x.morphNormals&&o.enable(7),x.morphColors&&o.enable(8),x.premultipliedAlpha&&o.enable(9),x.shadowMapEnabled&&o.enable(10),x.doubleSided&&o.enable(11),x.flipSided&&o.enable(12),x.useDepthPacking&&o.enable(13),x.dithering&&o.enable(14),x.transmission&&o.enable(15),x.sheen&&o.enable(16),x.opaque&&o.enable(17),x.pointsUvs&&o.enable(18),x.decodeVideoTexture&&o.enable(19),x.decodeVideoTextureEmissive&&o.enable(20),x.alphaToCoverage&&o.enable(21),v.push(o.mask)}function M(v){const x=_[v.type];let q;if(x){const C=Ot[x];q=ys.clone(C.uniforms)}else q=v.uniforms;return q}function A(v,x){let q=d.get(x);return q!==void 0?++q.usedTimes:(q=new Rd(n,x,v,r),l.push(q),d.set(x,q)),q}function I(v){if(--v.usedTimes===0){const x=l.indexOf(v);l[x]=l[l.length-1],l.pop(),d.delete(v.cacheKey),v.destroy()}}function P(v){s.remove(v)}function D(){s.dispose()}return{getParameters:R,getProgramCacheKey:m,getUniforms:M,acquireProgram:A,releaseProgram:I,releaseShaderCache:P,programs:l,dispose:D}}function Ld(){let n=new WeakMap;function t(o){return n.has(o)}function e(o){let s=n.get(o);return s===void 0&&(s={},n.set(o,s)),s}function i(o){n.delete(o)}function r(o,s,c){n.get(o)[s]=c}function a(){n=new WeakMap}return{has:t,get:e,remove:i,update:r,dispose:a}}function yd(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.material.id!==t.material.id?n.material.id-t.material.id:n.materialVariant!==t.materialVariant?n.materialVariant-t.materialVariant:n.z!==t.z?n.z-t.z:n.id-t.id}function da(n,t){return n.groupOrder!==t.groupOrder?n.groupOrder-t.groupOrder:n.renderOrder!==t.renderOrder?n.renderOrder-t.renderOrder:n.z!==t.z?t.z-n.z:n.id-t.id}function pa(){const n=[];let t=0;const e=[],i=[],r=[];function a(){t=0,e.length=0,i.length=0,r.length=0}function o(f){let _=0;return f.isInstancedMesh&&(_+=2),f.isSkinnedMesh&&(_+=1),_}function s(f,_,S,R,m,h){let T=n[t];return T===void 0?(T={id:f.id,object:f,geometry:_,material:S,materialVariant:o(f),groupOrder:R,renderOrder:f.renderOrder,z:m,group:h},n[t]=T):(T.id=f.id,T.object=f,T.geometry=_,T.material=S,T.materialVariant=o(f),T.groupOrder=R,T.renderOrder=f.renderOrder,T.z=m,T.group=h),t++,T}function c(f,_,S,R,m,h){const T=s(f,_,S,R,m,h);S.transmission>0?i.push(T):S.transparent===!0?r.push(T):e.push(T)}function l(f,_,S,R,m,h){const T=s(f,_,S,R,m,h);S.transmission>0?i.unshift(T):S.transparent===!0?r.unshift(T):e.unshift(T)}function d(f,_){e.length>1&&e.sort(f||yd),i.length>1&&i.sort(_||da),r.length>1&&r.sort(_||da)}function u(){for(let f=t,_=n.length;f<_;f++){const S=n[f];if(S.id===null)break;S.id=null,S.object=null,S.geometry=null,S.material=null,S.group=null}}return{opaque:e,transmissive:i,transparent:r,init:a,push:c,unshift:l,finish:u,sort:d}}function Id(){let n=new WeakMap;function t(i,r){const a=n.get(i);let o;return a===void 0?(o=new pa,n.set(i,[o])):r>=a.length?(o=new pa,a.push(o)):o=a[r],o}function e(){n=new WeakMap}return{get:t,dispose:e}}function Dd(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new Re,color:new De};break;case"SpotLight":e={position:new Re,direction:new Re,color:new De,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new Re,color:new De,distance:0,decay:0};break;case"HemisphereLight":e={direction:new Re,skyColor:new De,groundColor:new De};break;case"RectAreaLight":e={color:new De,position:new Re,halfWidth:new Re,halfHeight:new Re};break}return n[t.id]=e,e}}}function Ud(){const n={};return{get:function(t){if(n[t.id]!==void 0)return n[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new vt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new vt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new vt,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[t.id]=e,e}}}let Nd=0;function Fd(n,t){return(t.castShadow?2:0)-(n.castShadow?2:0)+(t.map?1:0)-(n.map?1:0)}function Od(n){const t=new Dd,e=Ud(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new Re);const r=new Re,a=new ke,o=new ke;function s(l){let d=0,u=0,f=0;for(let x=0;x<9;x++)i.probe[x].set(0,0,0);let _=0,S=0,R=0,m=0,h=0,T=0,M=0,A=0,I=0,P=0,D=0;l.sort(Fd);for(let x=0,q=l.length;x<q;x++){const C=l[x],G=C.color,k=C.intensity,z=C.distance;let K=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===zn?K=C.shadow.map.texture:K=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)d+=G.r*k,u+=G.g*k,f+=G.b*k;else if(C.isLightProbe){for(let F=0;F<9;F++)i.probe[F].addScaledVector(C.sh.coefficients[F],k);D++}else if(C.isDirectionalLight){const F=t.get(C);if(F.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const O=C.shadow,ne=e.get(C);ne.shadowIntensity=O.intensity,ne.shadowBias=O.bias,ne.shadowNormalBias=O.normalBias,ne.shadowRadius=O.radius,ne.shadowMapSize=O.mapSize,i.directionalShadow[_]=ne,i.directionalShadowMap[_]=K,i.directionalShadowMatrix[_]=C.shadow.matrix,T++}i.directional[_]=F,_++}else if(C.isSpotLight){const F=t.get(C);F.position.setFromMatrixPosition(C.matrixWorld),F.color.copy(G).multiplyScalar(k),F.distance=z,F.coneCos=Math.cos(C.angle),F.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),F.decay=C.decay,i.spot[R]=F;const O=C.shadow;if(C.map&&(i.spotLightMap[I]=C.map,I++,O.updateMatrices(C),C.castShadow&&P++),i.spotLightMatrix[R]=O.matrix,C.castShadow){const ne=e.get(C);ne.shadowIntensity=O.intensity,ne.shadowBias=O.bias,ne.shadowNormalBias=O.normalBias,ne.shadowRadius=O.radius,ne.shadowMapSize=O.mapSize,i.spotShadow[R]=ne,i.spotShadowMap[R]=K,A++}R++}else if(C.isRectAreaLight){const F=t.get(C);F.color.copy(G).multiplyScalar(k),F.halfWidth.set(C.width*.5,0,0),F.halfHeight.set(0,C.height*.5,0),i.rectArea[m]=F,m++}else if(C.isPointLight){const F=t.get(C);if(F.color.copy(C.color).multiplyScalar(C.intensity),F.distance=C.distance,F.decay=C.decay,C.castShadow){const O=C.shadow,ne=e.get(C);ne.shadowIntensity=O.intensity,ne.shadowBias=O.bias,ne.shadowNormalBias=O.normalBias,ne.shadowRadius=O.radius,ne.shadowMapSize=O.mapSize,ne.shadowCameraNear=O.camera.near,ne.shadowCameraFar=O.camera.far,i.pointShadow[S]=ne,i.pointShadowMap[S]=K,i.pointShadowMatrix[S]=C.shadow.matrix,M++}i.point[S]=F,S++}else if(C.isHemisphereLight){const F=t.get(C);F.skyColor.copy(C.color).multiplyScalar(k),F.groundColor.copy(C.groundColor).multiplyScalar(k),i.hemi[h]=F,h++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ae.LTC_FLOAT_1,i.rectAreaLTC2=ae.LTC_FLOAT_2):(i.rectAreaLTC1=ae.LTC_HALF_1,i.rectAreaLTC2=ae.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=u,i.ambient[2]=f;const v=i.hash;(v.directionalLength!==_||v.pointLength!==S||v.spotLength!==R||v.rectAreaLength!==m||v.hemiLength!==h||v.numDirectionalShadows!==T||v.numPointShadows!==M||v.numSpotShadows!==A||v.numSpotMaps!==I||v.numLightProbes!==D)&&(i.directional.length=_,i.spot.length=R,i.rectArea.length=m,i.point.length=S,i.hemi.length=h,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.pointShadow.length=M,i.pointShadowMap.length=M,i.spotShadow.length=A,i.spotShadowMap.length=A,i.directionalShadowMatrix.length=T,i.pointShadowMatrix.length=M,i.spotLightMatrix.length=A+I-P,i.spotLightMap.length=I,i.numSpotLightShadowsWithMaps=P,i.numLightProbes=D,v.directionalLength=_,v.pointLength=S,v.spotLength=R,v.rectAreaLength=m,v.hemiLength=h,v.numDirectionalShadows=T,v.numPointShadows=M,v.numSpotShadows=A,v.numSpotMaps=I,v.numLightProbes=D,i.version=Nd++)}function c(l,d){let u=0,f=0,_=0,S=0,R=0;const m=d.matrixWorldInverse;for(let h=0,T=l.length;h<T;h++){const M=l[h];if(M.isDirectionalLight){const A=i.directional[u];A.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),A.direction.sub(r),A.direction.transformDirection(m),u++}else if(M.isSpotLight){const A=i.spot[_];A.position.setFromMatrixPosition(M.matrixWorld),A.position.applyMatrix4(m),A.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),A.direction.sub(r),A.direction.transformDirection(m),_++}else if(M.isRectAreaLight){const A=i.rectArea[S];A.position.setFromMatrixPosition(M.matrixWorld),A.position.applyMatrix4(m),o.identity(),a.copy(M.matrixWorld),a.premultiply(m),o.extractRotation(a),A.halfWidth.set(M.width*.5,0,0),A.halfHeight.set(0,M.height*.5,0),A.halfWidth.applyMatrix4(o),A.halfHeight.applyMatrix4(o),S++}else if(M.isPointLight){const A=i.point[f];A.position.setFromMatrixPosition(M.matrixWorld),A.position.applyMatrix4(m),f++}else if(M.isHemisphereLight){const A=i.hemi[R];A.direction.setFromMatrixPosition(M.matrixWorld),A.direction.transformDirection(m),R++}}}return{setup:s,setupView:c,state:i}}function ha(n){const t=new Od(n),e=[],i=[];function r(d){l.camera=d,e.length=0,i.length=0}function a(d){e.push(d)}function o(d){i.push(d)}function s(){t.setup(e)}function c(d){t.setupView(e,d)}const l={lightsArray:e,shadowsArray:i,camera:null,lights:t,transmissionRenderTarget:{}};return{init:r,state:l,setupLights:s,setupLightsView:c,pushLight:a,pushShadow:o}}function Bd(n){let t=new WeakMap;function e(r,a=0){const o=t.get(r);let s;return o===void 0?(s=new ha(n),t.set(r,[s])):a>=o.length?(s=new ha(n),o.push(s)):s=o[a],s}function i(){t=new WeakMap}return{get:e,dispose:i}}const Gd=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Hd=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Vd=[new Re(1,0,0),new Re(-1,0,0),new Re(0,1,0),new Re(0,-1,0),new Re(0,0,1),new Re(0,0,-1)],kd=[new Re(0,-1,0),new Re(0,-1,0),new Re(0,0,1),new Re(0,0,-1),new Re(0,-1,0),new Re(0,-1,0)],ma=new ke,Nn=new Re,Ci=new Re;function zd(n,t,e){let i=new Aa;const r=new vt,a=new vt,o=new pt,s=new fs,c=new us,l={},d=e.maxTextureSize,u={[Cn]:Rt,[Rt]:Cn,[Gt]:Gt},f=new jt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new vt},radius:{value:4}},vertexShader:Gd,fragmentShader:Hd}),_=f.clone();_.defines.HORIZONTAL_PASS=1;const S=new an;S.setAttribute("position",new pn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const R=new It(S,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ti;let h=this.type;this.render=function(P,D,v){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||P.length===0)return;this.type===ds&&(Qe("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ti);const x=n.getRenderTarget(),q=n.getActiveCubeFace(),C=n.getActiveMipmapLevel(),G=n.state;G.setBlending(Yt),G.buffers.depth.getReversed()===!0?G.buffers.color.setClear(0,0,0,0):G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const k=h!==this.type;k&&D.traverse(function(z){z.material&&(Array.isArray(z.material)?z.material.forEach(K=>K.needsUpdate=!0):z.material.needsUpdate=!0)});for(let z=0,K=P.length;z<K;z++){const F=P[z],O=F.shadow;if(O===void 0){Qe("WebGLShadowMap:",F,"has no shadow.");continue}if(O.autoUpdate===!1&&O.needsUpdate===!1)continue;r.copy(O.mapSize);const ne=O.getFrameExtents();r.multiply(ne),a.copy(O.mapSize),(r.x>d||r.y>d)&&(r.x>d&&(a.x=Math.floor(d/ne.x),r.x=a.x*ne.x,O.mapSize.x=a.x),r.y>d&&(a.y=Math.floor(d/ne.y),r.y=a.y*ne.y,O.mapSize.y=a.y));const ee=n.state.buffers.depth.getReversed();if(O.camera._reversedDepth=ee,O.map===null||k===!0){if(O.map!==null&&(O.map.depthTexture!==null&&(O.map.depthTexture.dispose(),O.map.depthTexture=null),O.map.dispose()),this.type===Bn){if(F.isPointLight){Qe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}O.map=new Vt(r.x,r.y,{format:zn,type:on,minFilter:xt,magFilter:xt,generateMipmaps:!1}),O.map.texture.name=F.name+".shadowMap",O.map.depthTexture=new ai(r.x,r.y,nn),O.map.depthTexture.name=F.name+".shadowMapDepth",O.map.depthTexture.format=Pn,O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=qt,O.map.depthTexture.magFilter=qt}else F.isPointLight?(O.map=new oo(r.x),O.map.depthTexture=new ps(r.x,hn)):(O.map=new Vt(r.x,r.y),O.map.depthTexture=new ai(r.x,r.y,hn)),O.map.depthTexture.name=F.name+".shadowMap",O.map.depthTexture.format=Pn,this.type===ti?(O.map.depthTexture.compareFunction=ee?qi:Yi,O.map.depthTexture.minFilter=xt,O.map.depthTexture.magFilter=xt):(O.map.depthTexture.compareFunction=null,O.map.depthTexture.minFilter=qt,O.map.depthTexture.magFilter=qt);O.camera.updateProjectionMatrix()}const Te=O.map.isWebGLCubeRenderTarget?6:1;for(let Ae=0;Ae<Te;Ae++){if(O.map.isWebGLCubeRenderTarget)n.setRenderTarget(O.map,Ae),n.clear();else{Ae===0&&(n.setRenderTarget(O.map),n.clear());const ue=O.getViewport(Ae);o.set(a.x*ue.x,a.y*ue.y,a.x*ue.z,a.y*ue.w),G.viewport(o)}if(F.isPointLight){const ue=O.camera,Le=O.matrix,nt=F.distance||ue.far;nt!==ue.far&&(ue.far=nt,ue.updateProjectionMatrix()),Nn.setFromMatrixPosition(F.matrixWorld),ue.position.copy(Nn),Ci.copy(ue.position),Ci.add(Vd[Ae]),ue.up.copy(kd[Ae]),ue.lookAt(Ci),ue.updateMatrixWorld(),Le.makeTranslation(-Nn.x,-Nn.y,-Nn.z),ma.multiplyMatrices(ue.projectionMatrix,ue.matrixWorldInverse),O._frustum.setFromProjectionMatrix(ma,ue.coordinateSystem,ue.reversedDepth)}else O.updateMatrices(F);i=O.getFrustum(),A(D,v,O.camera,F,this.type)}O.isPointLightShadow!==!0&&this.type===Bn&&T(O,v),O.needsUpdate=!1}h=this.type,m.needsUpdate=!1,n.setRenderTarget(x,q,C)};function T(P,D){const v=t.update(R);f.defines.VSM_SAMPLES!==P.blurSamples&&(f.defines.VSM_SAMPLES=P.blurSamples,_.defines.VSM_SAMPLES=P.blurSamples,f.needsUpdate=!0,_.needsUpdate=!0),P.mapPass===null&&(P.mapPass=new Vt(r.x,r.y,{format:zn,type:on})),f.uniforms.shadow_pass.value=P.map.depthTexture,f.uniforms.resolution.value=P.mapSize,f.uniforms.radius.value=P.radius,n.setRenderTarget(P.mapPass),n.clear(),n.renderBufferDirect(D,null,v,f,R,null),_.uniforms.shadow_pass.value=P.mapPass.texture,_.uniforms.resolution.value=P.mapSize,_.uniforms.radius.value=P.radius,n.setRenderTarget(P.map),n.clear(),n.renderBufferDirect(D,null,v,_,R,null)}function M(P,D,v,x){let q=null;const C=v.isPointLight===!0?P.customDistanceMaterial:P.customDepthMaterial;if(C!==void 0)q=C;else if(q=v.isPointLight===!0?c:s,n.localClippingEnabled&&D.clipShadows===!0&&Array.isArray(D.clippingPlanes)&&D.clippingPlanes.length!==0||D.displacementMap&&D.displacementScale!==0||D.alphaMap&&D.alphaTest>0||D.map&&D.alphaTest>0||D.alphaToCoverage===!0){const G=q.uuid,k=D.uuid;let z=l[G];z===void 0&&(z={},l[G]=z);let K=z[k];K===void 0&&(K=q.clone(),z[k]=K,D.addEventListener("dispose",I)),q=K}if(q.visible=D.visible,q.wireframe=D.wireframe,x===Bn?q.side=D.shadowSide!==null?D.shadowSide:D.side:q.side=D.shadowSide!==null?D.shadowSide:u[D.side],q.alphaMap=D.alphaMap,q.alphaTest=D.alphaToCoverage===!0?.5:D.alphaTest,q.map=D.map,q.clipShadows=D.clipShadows,q.clippingPlanes=D.clippingPlanes,q.clipIntersection=D.clipIntersection,q.displacementMap=D.displacementMap,q.displacementScale=D.displacementScale,q.displacementBias=D.displacementBias,q.wireframeLinewidth=D.wireframeLinewidth,q.linewidth=D.linewidth,v.isPointLight===!0&&q.isMeshDistanceMaterial===!0){const G=n.properties.get(q);G.light=v}return q}function A(P,D,v,x,q){if(P.visible===!1)return;if(P.layers.test(D.layers)&&(P.isMesh||P.isLine||P.isPoints)&&(P.castShadow||P.receiveShadow&&q===Bn)&&(!P.frustumCulled||i.intersectsObject(P))){P.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,P.matrixWorld);const k=t.update(P),z=P.material;if(Array.isArray(z)){const K=k.groups;for(let F=0,O=K.length;F<O;F++){const ne=K[F],ee=z[ne.materialIndex];if(ee&&ee.visible){const Te=M(P,ee,x,q);P.onBeforeShadow(n,P,D,v,k,Te,ne),n.renderBufferDirect(v,null,k,Te,P,ne),P.onAfterShadow(n,P,D,v,k,Te,ne)}}}else if(z.visible){const K=M(P,z,x,q);P.onBeforeShadow(n,P,D,v,k,K,null),n.renderBufferDirect(v,null,k,K,P,null),P.onAfterShadow(n,P,D,v,k,K,null)}}const G=P.children;for(let k=0,z=G.length;k<z;k++)A(G[k],D,v,x,q)}function I(P){P.target.removeEventListener("dispose",I);for(const v in l){const x=l[v],q=P.target.uuid;q in x&&(x[q].dispose(),delete x[q])}}}function Wd(n,t){function e(){let w=!1;const re=new pt;let J=null;const fe=new pt(0,0,0,0);return{setMask:function($){J!==$&&!w&&(n.colorMask($,$,$,$),J=$)},setLocked:function($){w=$},setClear:function($,H,he,we,et){et===!0&&($*=we,H*=we,he*=we),re.set($,H,he,we),fe.equals(re)===!1&&(n.clearColor($,H,he,we),fe.copy(re))},reset:function(){w=!1,J=null,fe.set(-1,0,0,0)}}}function i(){let w=!1,re=!1,J=null,fe=null,$=null;return{setReversed:function(H){if(re!==H){const he=t.get("EXT_clip_control");H?he.clipControlEXT(he.LOWER_LEFT_EXT,he.ZERO_TO_ONE_EXT):he.clipControlEXT(he.LOWER_LEFT_EXT,he.NEGATIVE_ONE_TO_ONE_EXT),re=H;const we=$;$=null,this.setClear(we)}},getReversed:function(){return re},setTest:function(H){H?Z(n.DEPTH_TEST):te(n.DEPTH_TEST)},setMask:function(H){J!==H&&!w&&(n.depthMask(H),J=H)},setFunc:function(H){if(re&&(H=ks[H]),fe!==H){switch(H){case Cs:n.depthFunc(n.NEVER);break;case bs:n.depthFunc(n.ALWAYS);break;case Rs:n.depthFunc(n.LESS);break;case cr:n.depthFunc(n.LEQUAL);break;case As:n.depthFunc(n.EQUAL);break;case Ms:n.depthFunc(n.GEQUAL);break;case Ts:n.depthFunc(n.GREATER);break;case xs:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}fe=H}},setLocked:function(H){w=H},setClear:function(H){$!==H&&($=H,re&&(H=1-H),n.clearDepth(H))},reset:function(){w=!1,J=null,fe=null,$=null,re=!1}}}function r(){let w=!1,re=null,J=null,fe=null,$=null,H=null,he=null,we=null,et=null;return{setTest:function(Ke){w||(Ke?Z(n.STENCIL_TEST):te(n.STENCIL_TEST))},setMask:function(Ke){re!==Ke&&!w&&(n.stencilMask(Ke),re=Ke)},setFunc:function(Ke,zt,Wt){(J!==Ke||fe!==zt||$!==Wt)&&(n.stencilFunc(Ke,zt,Wt),J=Ke,fe=zt,$=Wt)},setOp:function(Ke,zt,Wt){(H!==Ke||he!==zt||we!==Wt)&&(n.stencilOp(Ke,zt,Wt),H=Ke,he=zt,we=Wt)},setLocked:function(Ke){w=Ke},setClear:function(Ke){et!==Ke&&(n.clearStencil(Ke),et=Ke)},reset:function(){w=!1,re=null,J=null,fe=null,$=null,H=null,he=null,we=null,et=null}}}const a=new e,o=new i,s=new r,c=new WeakMap,l=new WeakMap;let d={},u={},f=new WeakMap,_=[],S=null,R=!1,m=null,h=null,T=null,M=null,A=null,I=null,P=null,D=new De(0,0,0),v=0,x=!1,q=null,C=null,G=null,k=null,z=null;const K=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let F=!1,O=0;const ne=n.getParameter(n.VERSION);ne.indexOf("WebGL")!==-1?(O=parseFloat(/^WebGL (\d)/.exec(ne)[1]),F=O>=1):ne.indexOf("OpenGL ES")!==-1&&(O=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),F=O>=2);let ee=null,Te={};const Ae=n.getParameter(n.SCISSOR_BOX),ue=n.getParameter(n.VIEWPORT),Le=new pt().fromArray(Ae),nt=new pt().fromArray(ue);function qe(w,re,J,fe){const $=new Uint8Array(4),H=n.createTexture();n.bindTexture(w,H),n.texParameteri(w,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(w,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let he=0;he<J;he++)w===n.TEXTURE_3D||w===n.TEXTURE_2D_ARRAY?n.texImage3D(re,0,n.RGBA,1,1,fe,0,n.RGBA,n.UNSIGNED_BYTE,$):n.texImage2D(re+he,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,$);return H}const W={};W[n.TEXTURE_2D]=qe(n.TEXTURE_2D,n.TEXTURE_2D,1),W[n.TEXTURE_CUBE_MAP]=qe(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),W[n.TEXTURE_2D_ARRAY]=qe(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),W[n.TEXTURE_3D]=qe(n.TEXTURE_3D,n.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),Z(n.DEPTH_TEST),o.setFunc(cr),Ue(!1),st(Vr),Z(n.CULL_FACE),Xe(Yt);function Z(w){d[w]!==!0&&(n.enable(w),d[w]=!0)}function te(w){d[w]!==!1&&(n.disable(w),d[w]=!1)}function Pe(w,re){return u[w]!==re?(n.bindFramebuffer(w,re),u[w]=re,w===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=re),w===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=re),!0):!1}function Me(w,re){let J=_,fe=!1;if(w){J=f.get(re),J===void 0&&(J=[],f.set(re,J));const $=w.textures;if(J.length!==$.length||J[0]!==n.COLOR_ATTACHMENT0){for(let H=0,he=$.length;H<he;H++)J[H]=n.COLOR_ATTACHMENT0+H;J.length=$.length,fe=!0}}else J[0]!==n.BACK&&(J[0]=n.BACK,fe=!0);fe&&n.drawBuffers(J)}function be(w){return S!==w?(n.useProgram(w),S=w,!0):!1}const ot={[Dn]:n.FUNC_ADD,[Vo]:n.FUNC_SUBTRACT,[Ho]:n.FUNC_REVERSE_SUBTRACT};ot[zs]=n.MIN,ot[Ws]=n.MAX;const Ge={[ns]:n.ZERO,[ts]:n.ONE,[es]:n.SRC_COLOR,[Jo]:n.SRC_ALPHA,[Qo]:n.SRC_ALPHA_SATURATE,[Zo]:n.DST_COLOR,[$o]:n.DST_ALPHA,[jo]:n.ONE_MINUS_SRC_COLOR,[Yo]:n.ONE_MINUS_SRC_ALPHA,[qo]:n.ONE_MINUS_DST_COLOR,[Ko]:n.ONE_MINUS_DST_ALPHA,[Xo]:n.CONSTANT_COLOR,[Wo]:n.ONE_MINUS_CONSTANT_COLOR,[zo]:n.CONSTANT_ALPHA,[ko]:n.ONE_MINUS_CONSTANT_ALPHA};function Xe(w,re,J,fe,$,H,he,we,et,Ke){if(w===Yt){R===!0&&(te(n.BLEND),R=!1);return}if(R===!1&&(Z(n.BLEND),R=!0),w!==Ls){if(w!==m||Ke!==x){if((h!==Dn||A!==Dn)&&(n.blendEquation(n.FUNC_ADD),h=Dn,A=Dn),Ke)switch(w){case ni:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Wr:n.blendFunc(n.ONE,n.ONE);break;case zr:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case kr:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:it("WebGLState: Invalid blending: ",w);break}else switch(w){case ni:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Wr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case zr:it("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case kr:it("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:it("WebGLState: Invalid blending: ",w);break}T=null,M=null,I=null,P=null,D.set(0,0,0),v=0,m=w,x=Ke}return}$=$||re,H=H||J,he=he||fe,(re!==h||$!==A)&&(n.blendEquationSeparate(ot[re],ot[$]),h=re,A=$),(J!==T||fe!==M||H!==I||he!==P)&&(n.blendFuncSeparate(Ge[J],Ge[fe],Ge[H],Ge[he]),T=J,M=fe,I=H,P=he),(we.equals(D)===!1||et!==v)&&(n.blendColor(we.r,we.g,we.b,et),D.copy(we),v=et),m=w,x=!1}function $e(w,re){w.side===Gt?te(n.CULL_FACE):Z(n.CULL_FACE);let J=w.side===Rt;re&&(J=!J),Ue(J),w.blending===ni&&w.transparent===!1?Xe(Yt):Xe(w.blending,w.blendEquation,w.blendSrc,w.blendDst,w.blendEquationAlpha,w.blendSrcAlpha,w.blendDstAlpha,w.blendColor,w.blendAlpha,w.premultipliedAlpha),o.setFunc(w.depthFunc),o.setTest(w.depthTest),o.setMask(w.depthWrite),a.setMask(w.colorWrite);const fe=w.stencilWrite;s.setTest(fe),fe&&(s.setMask(w.stencilWriteMask),s.setFunc(w.stencilFunc,w.stencilRef,w.stencilFuncMask),s.setOp(w.stencilFail,w.stencilZFail,w.stencilZPass)),ut(w.polygonOffset,w.polygonOffsetFactor,w.polygonOffsetUnits),w.alphaToCoverage===!0?Z(n.SAMPLE_ALPHA_TO_COVERAGE):te(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ue(w){q!==w&&(w?n.frontFace(n.CW):n.frontFace(n.CCW),q=w)}function st(w){w!==Ps?(Z(n.CULL_FACE),w!==C&&(w===Vr?n.cullFace(n.BACK):w===ws?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):te(n.CULL_FACE),C=w}function b(w){w!==G&&(F&&n.lineWidth(w),G=w)}function ut(w,re,J){w?(Z(n.POLYGON_OFFSET_FILL),(k!==re||z!==J)&&(k=re,z=J,o.getReversed()&&(re=-re),n.polygonOffset(re,J))):te(n.POLYGON_OFFSET_FILL)}function We(w){w?Z(n.SCISSOR_TEST):te(n.SCISSOR_TEST)}function Je(w){w===void 0&&(w=n.TEXTURE0+K-1),ee!==w&&(n.activeTexture(w),ee=w)}function ge(w,re,J){J===void 0&&(ee===null?J=n.TEXTURE0+K-1:J=ee);let fe=Te[J];fe===void 0&&(fe={type:void 0,texture:void 0},Te[J]=fe),(fe.type!==w||fe.texture!==re)&&(ee!==J&&(n.activeTexture(J),ee=J),n.bindTexture(w,re||W[w]),fe.type=w,fe.texture=re)}function E(){const w=Te[ee];w!==void 0&&w.type!==void 0&&(n.bindTexture(w.type,null),w.type=void 0,w.texture=void 0)}function p(){try{n.compressedTexImage2D(...arguments)}catch(w){it("WebGLState:",w)}}function L(){try{n.compressedTexImage3D(...arguments)}catch(w){it("WebGLState:",w)}}function X(){try{n.texSubImage2D(...arguments)}catch(w){it("WebGLState:",w)}}function Y(){try{n.texSubImage3D(...arguments)}catch(w){it("WebGLState:",w)}}function V(){try{n.compressedTexSubImage2D(...arguments)}catch(w){it("WebGLState:",w)}}function de(){try{n.compressedTexSubImage3D(...arguments)}catch(w){it("WebGLState:",w)}}function ie(){try{n.texStorage2D(...arguments)}catch(w){it("WebGLState:",w)}}function xe(){try{n.texStorage3D(...arguments)}catch(w){it("WebGLState:",w)}}function Ce(){try{n.texImage2D(...arguments)}catch(w){it("WebGLState:",w)}}function j(){try{n.texImage3D(...arguments)}catch(w){it("WebGLState:",w)}}function Q(w){Le.equals(w)===!1&&(n.scissor(w.x,w.y,w.z,w.w),Le.copy(w))}function pe(w){nt.equals(w)===!1&&(n.viewport(w.x,w.y,w.z,w.w),nt.copy(w))}function me(w,re){let J=l.get(re);J===void 0&&(J=new WeakMap,l.set(re,J));let fe=J.get(w);fe===void 0&&(fe=n.getUniformBlockIndex(re,w.name),J.set(w,fe))}function ce(w,re){const fe=l.get(re).get(w);c.get(re)!==fe&&(n.uniformBlockBinding(re,fe,w.__bindingPointIndex),c.set(re,fe))}function Ne(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},ee=null,Te={},u={},f=new WeakMap,_=[],S=null,R=!1,m=null,h=null,T=null,M=null,A=null,I=null,P=null,D=new De(0,0,0),v=0,x=!1,q=null,C=null,G=null,k=null,z=null,Le.set(0,0,n.canvas.width,n.canvas.height),nt.set(0,0,n.canvas.width,n.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:Z,disable:te,bindFramebuffer:Pe,drawBuffers:Me,useProgram:be,setBlending:Xe,setMaterial:$e,setFlipSided:Ue,setCullFace:st,setLineWidth:b,setPolygonOffset:ut,setScissorTest:We,activeTexture:Je,bindTexture:ge,unbindTexture:E,compressedTexImage2D:p,compressedTexImage3D:L,texImage2D:Ce,texImage3D:j,updateUBOMapping:me,uniformBlockBinding:ce,texStorage2D:ie,texStorage3D:xe,texSubImage2D:X,texSubImage3D:Y,compressedTexSubImage2D:V,compressedTexSubImage3D:de,scissor:Q,viewport:pe,reset:Ne}}function Xd(n,t,e,i,r,a,o){const s=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new vt,d=new WeakMap;let u;const f=new WeakMap;let _=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(E,p){return _?new OffscreenCanvas(E,p):Bs("canvas")}function R(E,p,L){let X=1;const Y=ge(E);if((Y.width>L||Y.height>L)&&(X=L/Math.max(Y.width,Y.height)),X<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const V=Math.floor(X*Y.width),de=Math.floor(X*Y.height);u===void 0&&(u=S(V,de));const ie=p?S(V,de):u;return ie.width=V,ie.height=de,ie.getContext("2d").drawImage(E,0,0,V,de),Qe("WebGLRenderer: Texture has been resized from ("+Y.width+"x"+Y.height+") to ("+V+"x"+de+")."),ie}else return"data"in E&&Qe("WebGLRenderer: Image in DataTexture is too big ("+Y.width+"x"+Y.height+")."),E;return E}function m(E){return E.generateMipmaps}function h(E){n.generateMipmap(E)}function T(E){return E.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?n.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(E,p,L,X,Y=!1){if(E!==null){if(n[E]!==void 0)return n[E];Qe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let V=p;if(p===n.RED&&(L===n.FLOAT&&(V=n.R32F),L===n.HALF_FLOAT&&(V=n.R16F),L===n.UNSIGNED_BYTE&&(V=n.R8)),p===n.RED_INTEGER&&(L===n.UNSIGNED_BYTE&&(V=n.R8UI),L===n.UNSIGNED_SHORT&&(V=n.R16UI),L===n.UNSIGNED_INT&&(V=n.R32UI),L===n.BYTE&&(V=n.R8I),L===n.SHORT&&(V=n.R16I),L===n.INT&&(V=n.R32I)),p===n.RG&&(L===n.FLOAT&&(V=n.RG32F),L===n.HALF_FLOAT&&(V=n.RG16F),L===n.UNSIGNED_BYTE&&(V=n.RG8)),p===n.RG_INTEGER&&(L===n.UNSIGNED_BYTE&&(V=n.RG8UI),L===n.UNSIGNED_SHORT&&(V=n.RG16UI),L===n.UNSIGNED_INT&&(V=n.RG32UI),L===n.BYTE&&(V=n.RG8I),L===n.SHORT&&(V=n.RG16I),L===n.INT&&(V=n.RG32I)),p===n.RGB_INTEGER&&(L===n.UNSIGNED_BYTE&&(V=n.RGB8UI),L===n.UNSIGNED_SHORT&&(V=n.RGB16UI),L===n.UNSIGNED_INT&&(V=n.RGB32UI),L===n.BYTE&&(V=n.RGB8I),L===n.SHORT&&(V=n.RGB16I),L===n.INT&&(V=n.RGB32I)),p===n.RGBA_INTEGER&&(L===n.UNSIGNED_BYTE&&(V=n.RGBA8UI),L===n.UNSIGNED_SHORT&&(V=n.RGBA16UI),L===n.UNSIGNED_INT&&(V=n.RGBA32UI),L===n.BYTE&&(V=n.RGBA8I),L===n.SHORT&&(V=n.RGBA16I),L===n.INT&&(V=n.RGBA32I)),p===n.RGB&&(L===n.UNSIGNED_INT_5_9_9_9_REV&&(V=n.RGB9_E5),L===n.UNSIGNED_INT_10F_11F_11F_REV&&(V=n.R11F_G11F_B10F)),p===n.RGBA){const de=Y?Ka:ze.getTransfer(X);L===n.FLOAT&&(V=n.RGBA32F),L===n.HALF_FLOAT&&(V=n.RGBA16F),L===n.UNSIGNED_BYTE&&(V=de===tt?n.SRGB8_ALPHA8:n.RGBA8),L===n.UNSIGNED_SHORT_4_4_4_4&&(V=n.RGBA4),L===n.UNSIGNED_SHORT_5_5_5_1&&(V=n.RGB5_A1)}return(V===n.R16F||V===n.R32F||V===n.RG16F||V===n.RG32F||V===n.RGBA16F||V===n.RGBA32F)&&t.get("EXT_color_buffer_float"),V}function A(E,p){let L;return E?p===null||p===hn||p===kn?L=n.DEPTH24_STENCIL8:p===nn?L=n.DEPTH32F_STENCIL8:p===oi&&(L=n.DEPTH24_STENCIL8,Qe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):p===null||p===hn||p===kn?L=n.DEPTH_COMPONENT24:p===nn?L=n.DEPTH_COMPONENT32F:p===oi&&(L=n.DEPTH_COMPONENT16),L}function I(E,p){return m(E)===!0||E.isFramebufferTexture&&E.minFilter!==qt&&E.minFilter!==xt?Math.log2(Math.max(p.width,p.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?p.mipmaps.length:1}function P(E){const p=E.target;p.removeEventListener("dispose",P),v(p),p.isVideoTexture&&d.delete(p)}function D(E){const p=E.target;p.removeEventListener("dispose",D),q(p)}function v(E){const p=i.get(E);if(p.__webglInit===void 0)return;const L=E.source,X=f.get(L);if(X){const Y=X[p.__cacheKey];Y.usedTimes--,Y.usedTimes===0&&x(E),Object.keys(X).length===0&&f.delete(L)}i.remove(E)}function x(E){const p=i.get(E);n.deleteTexture(p.__webglTexture);const L=E.source,X=f.get(L);delete X[p.__cacheKey],o.memory.textures--}function q(E){const p=i.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),i.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(p.__webglFramebuffer[X]))for(let Y=0;Y<p.__webglFramebuffer[X].length;Y++)n.deleteFramebuffer(p.__webglFramebuffer[X][Y]);else n.deleteFramebuffer(p.__webglFramebuffer[X]);p.__webglDepthbuffer&&n.deleteRenderbuffer(p.__webglDepthbuffer[X])}else{if(Array.isArray(p.__webglFramebuffer))for(let X=0;X<p.__webglFramebuffer.length;X++)n.deleteFramebuffer(p.__webglFramebuffer[X]);else n.deleteFramebuffer(p.__webglFramebuffer);if(p.__webglDepthbuffer&&n.deleteRenderbuffer(p.__webglDepthbuffer),p.__webglMultisampledFramebuffer&&n.deleteFramebuffer(p.__webglMultisampledFramebuffer),p.__webglColorRenderbuffer)for(let X=0;X<p.__webglColorRenderbuffer.length;X++)p.__webglColorRenderbuffer[X]&&n.deleteRenderbuffer(p.__webglColorRenderbuffer[X]);p.__webglDepthRenderbuffer&&n.deleteRenderbuffer(p.__webglDepthRenderbuffer)}const L=E.textures;for(let X=0,Y=L.length;X<Y;X++){const V=i.get(L[X]);V.__webglTexture&&(n.deleteTexture(V.__webglTexture),o.memory.textures--),i.remove(L[X])}i.remove(E)}let C=0;function G(){C=0}function k(){const E=C;return E>=r.maxTextures&&Qe("WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+r.maxTextures),C+=1,E}function z(E){const p=[];return p.push(E.wrapS),p.push(E.wrapT),p.push(E.wrapR||0),p.push(E.magFilter),p.push(E.minFilter),p.push(E.anisotropy),p.push(E.internalFormat),p.push(E.format),p.push(E.type),p.push(E.generateMipmaps),p.push(E.premultiplyAlpha),p.push(E.flipY),p.push(E.unpackAlignment),p.push(E.colorSpace),p.join()}function K(E,p){const L=i.get(E);if(E.isVideoTexture&&We(E),E.isRenderTargetTexture===!1&&E.isExternalTexture!==!0&&E.version>0&&L.__version!==E.version){const X=E.image;if(X===null)Qe("WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)Qe("WebGLRenderer: Texture marked for update but image is incomplete");else{W(L,E,p);return}}else E.isExternalTexture&&(L.__webglTexture=E.sourceTexture?E.sourceTexture:null);e.bindTexture(n.TEXTURE_2D,L.__webglTexture,n.TEXTURE0+p)}function F(E,p){const L=i.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&L.__version!==E.version){W(L,E,p);return}else E.isExternalTexture&&(L.__webglTexture=E.sourceTexture?E.sourceTexture:null);e.bindTexture(n.TEXTURE_2D_ARRAY,L.__webglTexture,n.TEXTURE0+p)}function O(E,p){const L=i.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&L.__version!==E.version){W(L,E,p);return}e.bindTexture(n.TEXTURE_3D,L.__webglTexture,n.TEXTURE0+p)}function ne(E,p){const L=i.get(E);if(E.isCubeDepthTexture!==!0&&E.version>0&&L.__version!==E.version){Z(L,E,p);return}e.bindTexture(n.TEXTURE_CUBE_MAP,L.__webglTexture,n.TEXTURE0+p)}const ee={[Ln]:n.REPEAT,[wn]:n.CLAMP_TO_EDGE,[ba]:n.MIRRORED_REPEAT},Te={[qt]:n.NEAREST,[Ca]:n.NEAREST_MIPMAP_NEAREST,[On]:n.NEAREST_MIPMAP_LINEAR,[xt]:n.LINEAR,[ei]:n.LINEAR_MIPMAP_NEAREST,[tn]:n.LINEAR_MIPMAP_LINEAR},Ae={[cs]:n.NEVER,[ss]:n.ALWAYS,[os]:n.LESS,[Yi]:n.LEQUAL,[as]:n.EQUAL,[qi]:n.GEQUAL,[rs]:n.GREATER,[is]:n.NOTEQUAL};function ue(E,p){if(p.type===nn&&t.has("OES_texture_float_linear")===!1&&(p.magFilter===xt||p.magFilter===ei||p.magFilter===On||p.magFilter===tn||p.minFilter===xt||p.minFilter===ei||p.minFilter===On||p.minFilter===tn)&&Qe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(E,n.TEXTURE_WRAP_S,ee[p.wrapS]),n.texParameteri(E,n.TEXTURE_WRAP_T,ee[p.wrapT]),(E===n.TEXTURE_3D||E===n.TEXTURE_2D_ARRAY)&&n.texParameteri(E,n.TEXTURE_WRAP_R,ee[p.wrapR]),n.texParameteri(E,n.TEXTURE_MAG_FILTER,Te[p.magFilter]),n.texParameteri(E,n.TEXTURE_MIN_FILTER,Te[p.minFilter]),p.compareFunction&&(n.texParameteri(E,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(E,n.TEXTURE_COMPARE_FUNC,Ae[p.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(p.magFilter===qt||p.minFilter!==On&&p.minFilter!==tn||p.type===nn&&t.has("OES_texture_float_linear")===!1)return;if(p.anisotropy>1||i.get(p).__currentAnisotropy){const L=t.get("EXT_texture_filter_anisotropic");n.texParameterf(E,L.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(p.anisotropy,r.getMaxAnisotropy())),i.get(p).__currentAnisotropy=p.anisotropy}}}function Le(E,p){let L=!1;E.__webglInit===void 0&&(E.__webglInit=!0,p.addEventListener("dispose",P));const X=p.source;let Y=f.get(X);Y===void 0&&(Y={},f.set(X,Y));const V=z(p);if(V!==E.__cacheKey){Y[V]===void 0&&(Y[V]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,L=!0),Y[V].usedTimes++;const de=Y[E.__cacheKey];de!==void 0&&(Y[E.__cacheKey].usedTimes--,de.usedTimes===0&&x(p)),E.__cacheKey=V,E.__webglTexture=Y[V].texture}return L}function nt(E,p,L){return Math.floor(Math.floor(E/L)/p)}function qe(E,p,L,X){const V=E.updateRanges;if(V.length===0)e.texSubImage2D(n.TEXTURE_2D,0,0,0,p.width,p.height,L,X,p.data);else{V.sort((j,Q)=>j.start-Q.start);let de=0;for(let j=1;j<V.length;j++){const Q=V[de],pe=V[j],me=Q.start+Q.count,ce=nt(pe.start,p.width,4),Ne=nt(Q.start,p.width,4);pe.start<=me+1&&ce===Ne&&nt(pe.start+pe.count-1,p.width,4)===ce?Q.count=Math.max(Q.count,pe.start+pe.count-Q.start):(++de,V[de]=pe)}V.length=de+1;const ie=n.getParameter(n.UNPACK_ROW_LENGTH),xe=n.getParameter(n.UNPACK_SKIP_PIXELS),Ce=n.getParameter(n.UNPACK_SKIP_ROWS);n.pixelStorei(n.UNPACK_ROW_LENGTH,p.width);for(let j=0,Q=V.length;j<Q;j++){const pe=V[j],me=Math.floor(pe.start/4),ce=Math.ceil(pe.count/4),Ne=me%p.width,w=Math.floor(me/p.width),re=ce,J=1;n.pixelStorei(n.UNPACK_SKIP_PIXELS,Ne),n.pixelStorei(n.UNPACK_SKIP_ROWS,w),e.texSubImage2D(n.TEXTURE_2D,0,Ne,w,re,J,L,X,p.data)}E.clearUpdateRanges(),n.pixelStorei(n.UNPACK_ROW_LENGTH,ie),n.pixelStorei(n.UNPACK_SKIP_PIXELS,xe),n.pixelStorei(n.UNPACK_SKIP_ROWS,Ce)}}function W(E,p,L){let X=n.TEXTURE_2D;(p.isDataArrayTexture||p.isCompressedArrayTexture)&&(X=n.TEXTURE_2D_ARRAY),p.isData3DTexture&&(X=n.TEXTURE_3D);const Y=Le(E,p),V=p.source;e.bindTexture(X,E.__webglTexture,n.TEXTURE0+L);const de=i.get(V);if(V.version!==de.__version||Y===!0){e.activeTexture(n.TEXTURE0+L);const ie=ze.getPrimaries(ze.workingColorSpace),xe=p.colorSpace===Sn?null:ze.getPrimaries(p.colorSpace),Ce=p.colorSpace===Sn||ie===xe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,p.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,p.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,p.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce);let j=R(p.image,!1,r.maxTextureSize);j=Je(p,j);const Q=a.convert(p.format,p.colorSpace),pe=a.convert(p.type);let me=M(p.internalFormat,Q,pe,p.colorSpace,p.isVideoTexture);ue(X,p);let ce;const Ne=p.mipmaps,w=p.isVideoTexture!==!0,re=de.__version===void 0||Y===!0,J=V.dataReady,fe=I(p,j);if(p.isDepthTexture)me=A(p.format===En,p.type),re&&(w?e.texStorage2D(n.TEXTURE_2D,1,me,j.width,j.height):e.texImage2D(n.TEXTURE_2D,0,me,j.width,j.height,0,Q,pe,null));else if(p.isDataTexture)if(Ne.length>0){w&&re&&e.texStorage2D(n.TEXTURE_2D,fe,me,Ne[0].width,Ne[0].height);for(let $=0,H=Ne.length;$<H;$++)ce=Ne[$],w?J&&e.texSubImage2D(n.TEXTURE_2D,$,0,0,ce.width,ce.height,Q,pe,ce.data):e.texImage2D(n.TEXTURE_2D,$,me,ce.width,ce.height,0,Q,pe,ce.data);p.generateMipmaps=!1}else w?(re&&e.texStorage2D(n.TEXTURE_2D,fe,me,j.width,j.height),J&&qe(p,j,Q,pe)):e.texImage2D(n.TEXTURE_2D,0,me,j.width,j.height,0,Q,pe,j.data);else if(p.isCompressedTexture)if(p.isCompressedArrayTexture){w&&re&&e.texStorage3D(n.TEXTURE_2D_ARRAY,fe,me,Ne[0].width,Ne[0].height,j.depth);for(let $=0,H=Ne.length;$<H;$++)if(ce=Ne[$],p.format!==Kt)if(Q!==null)if(w){if(J)if(p.layerUpdates.size>0){const he=Xr(ce.width,ce.height,p.format,p.type);for(const we of p.layerUpdates){const et=ce.data.subarray(we*he/ce.data.BYTES_PER_ELEMENT,(we+1)*he/ce.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,we,ce.width,ce.height,1,Q,et)}p.clearLayerUpdates()}else e.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,0,ce.width,ce.height,j.depth,Q,ce.data)}else e.compressedTexImage3D(n.TEXTURE_2D_ARRAY,$,me,ce.width,ce.height,j.depth,0,ce.data,0,0);else Qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else w?J&&e.texSubImage3D(n.TEXTURE_2D_ARRAY,$,0,0,0,ce.width,ce.height,j.depth,Q,pe,ce.data):e.texImage3D(n.TEXTURE_2D_ARRAY,$,me,ce.width,ce.height,j.depth,0,Q,pe,ce.data)}else{w&&re&&e.texStorage2D(n.TEXTURE_2D,fe,me,Ne[0].width,Ne[0].height);for(let $=0,H=Ne.length;$<H;$++)ce=Ne[$],p.format!==Kt?Q!==null?w?J&&e.compressedTexSubImage2D(n.TEXTURE_2D,$,0,0,ce.width,ce.height,Q,ce.data):e.compressedTexImage2D(n.TEXTURE_2D,$,me,ce.width,ce.height,0,ce.data):Qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):w?J&&e.texSubImage2D(n.TEXTURE_2D,$,0,0,ce.width,ce.height,Q,pe,ce.data):e.texImage2D(n.TEXTURE_2D,$,me,ce.width,ce.height,0,Q,pe,ce.data)}else if(p.isDataArrayTexture)if(w){if(re&&e.texStorage3D(n.TEXTURE_2D_ARRAY,fe,me,j.width,j.height,j.depth),J)if(p.layerUpdates.size>0){const $=Xr(j.width,j.height,p.format,p.type);for(const H of p.layerUpdates){const he=j.data.subarray(H*$/j.data.BYTES_PER_ELEMENT,(H+1)*$/j.data.BYTES_PER_ELEMENT);e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,H,j.width,j.height,1,Q,pe,he)}p.clearLayerUpdates()}else e.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,Q,pe,j.data)}else e.texImage3D(n.TEXTURE_2D_ARRAY,0,me,j.width,j.height,j.depth,0,Q,pe,j.data);else if(p.isData3DTexture)w?(re&&e.texStorage3D(n.TEXTURE_3D,fe,me,j.width,j.height,j.depth),J&&e.texSubImage3D(n.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,Q,pe,j.data)):e.texImage3D(n.TEXTURE_3D,0,me,j.width,j.height,j.depth,0,Q,pe,j.data);else if(p.isFramebufferTexture){if(re)if(w)e.texStorage2D(n.TEXTURE_2D,fe,me,j.width,j.height);else{let $=j.width,H=j.height;for(let he=0;he<fe;he++)e.texImage2D(n.TEXTURE_2D,he,me,$,H,0,Q,pe,null),$>>=1,H>>=1}}else if(Ne.length>0){if(w&&re){const $=ge(Ne[0]);e.texStorage2D(n.TEXTURE_2D,fe,me,$.width,$.height)}for(let $=0,H=Ne.length;$<H;$++)ce=Ne[$],w?J&&e.texSubImage2D(n.TEXTURE_2D,$,0,0,Q,pe,ce):e.texImage2D(n.TEXTURE_2D,$,me,Q,pe,ce);p.generateMipmaps=!1}else if(w){if(re){const $=ge(j);e.texStorage2D(n.TEXTURE_2D,fe,me,$.width,$.height)}J&&e.texSubImage2D(n.TEXTURE_2D,0,0,0,Q,pe,j)}else e.texImage2D(n.TEXTURE_2D,0,me,Q,pe,j);m(p)&&h(X),de.__version=V.version,p.onUpdate&&p.onUpdate(p)}E.__version=p.version}function Z(E,p,L){if(p.image.length!==6)return;const X=Le(E,p),Y=p.source;e.bindTexture(n.TEXTURE_CUBE_MAP,E.__webglTexture,n.TEXTURE0+L);const V=i.get(Y);if(Y.version!==V.__version||X===!0){e.activeTexture(n.TEXTURE0+L);const de=ze.getPrimaries(ze.workingColorSpace),ie=p.colorSpace===Sn?null:ze.getPrimaries(p.colorSpace),xe=p.colorSpace===Sn||de===ie?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,p.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,p.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,p.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,xe);const Ce=p.isCompressedTexture||p.image[0].isCompressedTexture,j=p.image[0]&&p.image[0].isDataTexture,Q=[];for(let H=0;H<6;H++)!Ce&&!j?Q[H]=R(p.image[H],!0,r.maxCubemapSize):Q[H]=j?p.image[H].image:p.image[H],Q[H]=Je(p,Q[H]);const pe=Q[0],me=a.convert(p.format,p.colorSpace),ce=a.convert(p.type),Ne=M(p.internalFormat,me,ce,p.colorSpace),w=p.isVideoTexture!==!0,re=V.__version===void 0||X===!0,J=Y.dataReady;let fe=I(p,pe);ue(n.TEXTURE_CUBE_MAP,p);let $;if(Ce){w&&re&&e.texStorage2D(n.TEXTURE_CUBE_MAP,fe,Ne,pe.width,pe.height);for(let H=0;H<6;H++){$=Q[H].mipmaps;for(let he=0;he<$.length;he++){const we=$[he];p.format!==Kt?me!==null?w?J&&e.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he,0,0,we.width,we.height,me,we.data):e.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he,Ne,we.width,we.height,0,we.data):Qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):w?J&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he,0,0,we.width,we.height,me,ce,we.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he,Ne,we.width,we.height,0,me,ce,we.data)}}}else{if($=p.mipmaps,w&&re){$.length>0&&fe++;const H=ge(Q[0]);e.texStorage2D(n.TEXTURE_CUBE_MAP,fe,Ne,H.width,H.height)}for(let H=0;H<6;H++)if(j){w?J&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,0,0,Q[H].width,Q[H].height,me,ce,Q[H].data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,Ne,Q[H].width,Q[H].height,0,me,ce,Q[H].data);for(let he=0;he<$.length;he++){const et=$[he].image[H].image;w?J&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he+1,0,0,et.width,et.height,me,ce,et.data):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he+1,Ne,et.width,et.height,0,me,ce,et.data)}}else{w?J&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,0,0,me,ce,Q[H]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,Ne,me,ce,Q[H]);for(let he=0;he<$.length;he++){const we=$[he];w?J&&e.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he+1,0,0,me,ce,we.image[H]):e.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+H,he+1,Ne,me,ce,we.image[H])}}}m(p)&&h(n.TEXTURE_CUBE_MAP),V.__version=Y.version,p.onUpdate&&p.onUpdate(p)}E.__version=p.version}function te(E,p,L,X,Y,V){const de=a.convert(L.format,L.colorSpace),ie=a.convert(L.type),xe=M(L.internalFormat,de,ie,L.colorSpace),Ce=i.get(p),j=i.get(L);if(j.__renderTarget=p,!Ce.__hasExternalTextures){const Q=Math.max(1,p.width>>V),pe=Math.max(1,p.height>>V);Y===n.TEXTURE_3D||Y===n.TEXTURE_2D_ARRAY?e.texImage3D(Y,V,xe,Q,pe,p.depth,0,de,ie,null):e.texImage2D(Y,V,xe,Q,pe,0,de,ie,null)}e.bindFramebuffer(n.FRAMEBUFFER,E),ut(p)?s.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,X,Y,j.__webglTexture,0,b(p)):(Y===n.TEXTURE_2D||Y>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Y<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,X,Y,j.__webglTexture,V),e.bindFramebuffer(n.FRAMEBUFFER,null)}function Pe(E,p,L){if(n.bindRenderbuffer(n.RENDERBUFFER,E),p.depthBuffer){const X=p.depthTexture,Y=X&&X.isDepthTexture?X.type:null,V=A(p.stencilBuffer,Y),de=p.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;ut(p)?s.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,b(p),V,p.width,p.height):L?n.renderbufferStorageMultisample(n.RENDERBUFFER,b(p),V,p.width,p.height):n.renderbufferStorage(n.RENDERBUFFER,V,p.width,p.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,de,n.RENDERBUFFER,E)}else{const X=p.textures;for(let Y=0;Y<X.length;Y++){const V=X[Y],de=a.convert(V.format,V.colorSpace),ie=a.convert(V.type),xe=M(V.internalFormat,de,ie,V.colorSpace);ut(p)?s.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,b(p),xe,p.width,p.height):L?n.renderbufferStorageMultisample(n.RENDERBUFFER,b(p),xe,p.width,p.height):n.renderbufferStorage(n.RENDERBUFFER,xe,p.width,p.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Me(E,p,L){const X=p.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(n.FRAMEBUFFER,E),!(p.depthTexture&&p.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Y=i.get(p.depthTexture);if(Y.__renderTarget=p,(!Y.__webglTexture||p.depthTexture.image.width!==p.width||p.depthTexture.image.height!==p.height)&&(p.depthTexture.image.width=p.width,p.depthTexture.image.height=p.height,p.depthTexture.needsUpdate=!0),X){if(Y.__webglInit===void 0&&(Y.__webglInit=!0,p.depthTexture.addEventListener("dispose",P)),Y.__webglTexture===void 0){Y.__webglTexture=n.createTexture(),e.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),ue(n.TEXTURE_CUBE_MAP,p.depthTexture);const Ce=a.convert(p.depthTexture.format),j=a.convert(p.depthTexture.type);let Q;p.depthTexture.format===Pn?Q=n.DEPTH_COMPONENT24:p.depthTexture.format===En&&(Q=n.DEPTH24_STENCIL8);for(let pe=0;pe<6;pe++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,Q,p.width,p.height,0,Ce,j,null)}}else K(p.depthTexture,0);const V=Y.__webglTexture,de=b(p),ie=X?n.TEXTURE_CUBE_MAP_POSITIVE_X+L:n.TEXTURE_2D,xe=p.depthTexture.format===En?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(p.depthTexture.format===Pn)ut(p)?s.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,xe,ie,V,0,de):n.framebufferTexture2D(n.FRAMEBUFFER,xe,ie,V,0);else if(p.depthTexture.format===En)ut(p)?s.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,xe,ie,V,0,de):n.framebufferTexture2D(n.FRAMEBUFFER,xe,ie,V,0);else throw new Error("Unknown depthTexture format")}function be(E){const p=i.get(E),L=E.isWebGLCubeRenderTarget===!0;if(p.__boundDepthTexture!==E.depthTexture){const X=E.depthTexture;if(p.__depthDisposeCallback&&p.__depthDisposeCallback(),X){const Y=()=>{delete p.__boundDepthTexture,delete p.__depthDisposeCallback,X.removeEventListener("dispose",Y)};X.addEventListener("dispose",Y),p.__depthDisposeCallback=Y}p.__boundDepthTexture=X}if(E.depthTexture&&!p.__autoAllocateDepthBuffer)if(L)for(let X=0;X<6;X++)Me(p.__webglFramebuffer[X],E,X);else{const X=E.texture.mipmaps;X&&X.length>0?Me(p.__webglFramebuffer[0],E,0):Me(p.__webglFramebuffer,E,0)}else if(L){p.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(e.bindFramebuffer(n.FRAMEBUFFER,p.__webglFramebuffer[X]),p.__webglDepthbuffer[X]===void 0)p.__webglDepthbuffer[X]=n.createRenderbuffer(),Pe(p.__webglDepthbuffer[X],E,!1);else{const Y=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,V=p.__webglDepthbuffer[X];n.bindRenderbuffer(n.RENDERBUFFER,V),n.framebufferRenderbuffer(n.FRAMEBUFFER,Y,n.RENDERBUFFER,V)}}else{const X=E.texture.mipmaps;if(X&&X.length>0?e.bindFramebuffer(n.FRAMEBUFFER,p.__webglFramebuffer[0]):e.bindFramebuffer(n.FRAMEBUFFER,p.__webglFramebuffer),p.__webglDepthbuffer===void 0)p.__webglDepthbuffer=n.createRenderbuffer(),Pe(p.__webglDepthbuffer,E,!1);else{const Y=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,V=p.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,V),n.framebufferRenderbuffer(n.FRAMEBUFFER,Y,n.RENDERBUFFER,V)}}e.bindFramebuffer(n.FRAMEBUFFER,null)}function ot(E,p,L){const X=i.get(E);p!==void 0&&te(X.__webglFramebuffer,E,E.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),L!==void 0&&be(E)}function Ge(E){const p=E.texture,L=i.get(E),X=i.get(p);E.addEventListener("dispose",D);const Y=E.textures,V=E.isWebGLCubeRenderTarget===!0,de=Y.length>1;if(de||(X.__webglTexture===void 0&&(X.__webglTexture=n.createTexture()),X.__version=p.version,o.memory.textures++),V){L.__webglFramebuffer=[];for(let ie=0;ie<6;ie++)if(p.mipmaps&&p.mipmaps.length>0){L.__webglFramebuffer[ie]=[];for(let xe=0;xe<p.mipmaps.length;xe++)L.__webglFramebuffer[ie][xe]=n.createFramebuffer()}else L.__webglFramebuffer[ie]=n.createFramebuffer()}else{if(p.mipmaps&&p.mipmaps.length>0){L.__webglFramebuffer=[];for(let ie=0;ie<p.mipmaps.length;ie++)L.__webglFramebuffer[ie]=n.createFramebuffer()}else L.__webglFramebuffer=n.createFramebuffer();if(de)for(let ie=0,xe=Y.length;ie<xe;ie++){const Ce=i.get(Y[ie]);Ce.__webglTexture===void 0&&(Ce.__webglTexture=n.createTexture(),o.memory.textures++)}if(E.samples>0&&ut(E)===!1){L.__webglMultisampledFramebuffer=n.createFramebuffer(),L.__webglColorRenderbuffer=[],e.bindFramebuffer(n.FRAMEBUFFER,L.__webglMultisampledFramebuffer);for(let ie=0;ie<Y.length;ie++){const xe=Y[ie];L.__webglColorRenderbuffer[ie]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,L.__webglColorRenderbuffer[ie]);const Ce=a.convert(xe.format,xe.colorSpace),j=a.convert(xe.type),Q=M(xe.internalFormat,Ce,j,xe.colorSpace,E.isXRRenderTarget===!0),pe=b(E);n.renderbufferStorageMultisample(n.RENDERBUFFER,pe,Q,E.width,E.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ie,n.RENDERBUFFER,L.__webglColorRenderbuffer[ie])}n.bindRenderbuffer(n.RENDERBUFFER,null),E.depthBuffer&&(L.__webglDepthRenderbuffer=n.createRenderbuffer(),Pe(L.__webglDepthRenderbuffer,E,!0)),e.bindFramebuffer(n.FRAMEBUFFER,null)}}if(V){e.bindTexture(n.TEXTURE_CUBE_MAP,X.__webglTexture),ue(n.TEXTURE_CUBE_MAP,p);for(let ie=0;ie<6;ie++)if(p.mipmaps&&p.mipmaps.length>0)for(let xe=0;xe<p.mipmaps.length;xe++)te(L.__webglFramebuffer[ie][xe],E,p,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,xe);else te(L.__webglFramebuffer[ie],E,p,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0);m(p)&&h(n.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(de){for(let ie=0,xe=Y.length;ie<xe;ie++){const Ce=Y[ie],j=i.get(Ce);let Q=n.TEXTURE_2D;(E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(Q=E.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(Q,j.__webglTexture),ue(Q,Ce),te(L.__webglFramebuffer,E,Ce,n.COLOR_ATTACHMENT0+ie,Q,0),m(Ce)&&h(Q)}e.unbindTexture()}else{let ie=n.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(ie=E.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),e.bindTexture(ie,X.__webglTexture),ue(ie,p),p.mipmaps&&p.mipmaps.length>0)for(let xe=0;xe<p.mipmaps.length;xe++)te(L.__webglFramebuffer[xe],E,p,n.COLOR_ATTACHMENT0,ie,xe);else te(L.__webglFramebuffer,E,p,n.COLOR_ATTACHMENT0,ie,0);m(p)&&h(ie),e.unbindTexture()}E.depthBuffer&&be(E)}function Xe(E){const p=E.textures;for(let L=0,X=p.length;L<X;L++){const Y=p[L];if(m(Y)){const V=T(E),de=i.get(Y).__webglTexture;e.bindTexture(V,de),h(V),e.unbindTexture()}}}const $e=[],Ue=[];function st(E){if(E.samples>0){if(ut(E)===!1){const p=E.textures,L=E.width,X=E.height;let Y=n.COLOR_BUFFER_BIT;const V=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,de=i.get(E),ie=p.length>1;if(ie)for(let Ce=0;Ce<p.length;Ce++)e.bindFramebuffer(n.FRAMEBUFFER,de.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.RENDERBUFFER,null),e.bindFramebuffer(n.FRAMEBUFFER,de.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.TEXTURE_2D,null,0);e.bindFramebuffer(n.READ_FRAMEBUFFER,de.__webglMultisampledFramebuffer);const xe=E.texture.mipmaps;xe&&xe.length>0?e.bindFramebuffer(n.DRAW_FRAMEBUFFER,de.__webglFramebuffer[0]):e.bindFramebuffer(n.DRAW_FRAMEBUFFER,de.__webglFramebuffer);for(let Ce=0;Ce<p.length;Ce++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Y|=n.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Y|=n.STENCIL_BUFFER_BIT)),ie){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,de.__webglColorRenderbuffer[Ce]);const j=i.get(p[Ce]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,j,0)}n.blitFramebuffer(0,0,L,X,0,0,L,X,Y,n.NEAREST),c===!0&&($e.length=0,Ue.length=0,$e.push(n.COLOR_ATTACHMENT0+Ce),E.depthBuffer&&E.resolveDepthBuffer===!1&&($e.push(V),Ue.push(V),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Ue)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,$e))}if(e.bindFramebuffer(n.READ_FRAMEBUFFER,null),e.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ie)for(let Ce=0;Ce<p.length;Ce++){e.bindFramebuffer(n.FRAMEBUFFER,de.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.RENDERBUFFER,de.__webglColorRenderbuffer[Ce]);const j=i.get(p[Ce]).__webglTexture;e.bindFramebuffer(n.FRAMEBUFFER,de.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ce,n.TEXTURE_2D,j,0)}e.bindFramebuffer(n.DRAW_FRAMEBUFFER,de.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&c){const p=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[p])}}}function b(E){return Math.min(r.maxSamples,E.samples)}function ut(E){const p=i.get(E);return E.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&p.__useRenderToTexture!==!1}function We(E){const p=o.render.frame;d.get(E)!==p&&(d.set(E,p),E.update())}function Je(E,p){const L=E.colorSpace,X=E.format,Y=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||L!==bt&&L!==Sn&&(ze.getTransfer(L)===tt?(X!==Kt||Y!==Bt)&&Qe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):it("WebGLTextures: Unsupported texture color space:",L)),p}function ge(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(l.width=E.naturalWidth||E.width,l.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(l.width=E.displayWidth,l.height=E.displayHeight):(l.width=E.width,l.height=E.height),l}this.allocateTextureUnit=k,this.resetTextureUnits=G,this.setTexture2D=K,this.setTexture2DArray=F,this.setTexture3D=O,this.setTextureCube=ne,this.rebindTextures=ot,this.setupRenderTarget=Ge,this.updateRenderTargetMipmap=Xe,this.updateMultisampleRenderTarget=st,this.setupDepthRenderbuffer=be,this.setupFrameBufferTexture=te,this.useMultisampledRTT=ut,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Kd(n,t){function e(i,r=Sn){let a;const o=ze.getTransfer(r);if(i===Bt)return n.UNSIGNED_BYTE;if(i===ya)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Ia)return n.UNSIGNED_SHORT_5_5_5_1;if(i===hs)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===ms)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===_s)return n.BYTE;if(i===gs)return n.SHORT;if(i===oi)return n.UNSIGNED_SHORT;if(i===Na)return n.INT;if(i===hn)return n.UNSIGNED_INT;if(i===nn)return n.FLOAT;if(i===on)return n.HALF_FLOAT;if(i===vs)return n.ALPHA;if(i===Ss)return n.RGB;if(i===Kt)return n.RGBA;if(i===Pn)return n.DEPTH_COMPONENT;if(i===En)return n.DEPTH_STENCIL;if(i===Es)return n.RED;if(i===La)return n.RED_INTEGER;if(i===zn)return n.RG;if(i===wa)return n.RG_INTEGER;if(i===Pa)return n.RGBA_INTEGER;if(i===_i||i===gi||i===vi||i===Si)if(o===tt)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===_i)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===gi)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===vi)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Si)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===_i)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===gi)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===vi)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Si)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===lr||i===fr||i===ur||i===dr)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===lr)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===fr)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===ur)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===dr)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===pr||i===hr||i===mr||i===_r||i===gr||i===vr||i===Sr)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===pr||i===hr)return o===tt?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===mr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===_r)return a.COMPRESSED_R11_EAC;if(i===gr)return a.COMPRESSED_SIGNED_R11_EAC;if(i===vr)return a.COMPRESSED_RG11_EAC;if(i===Sr)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Er||i===xr||i===Tr||i===Mr||i===Ar||i===Rr||i===br||i===Cr||i===Pr||i===wr||i===Lr||i===yr||i===Ir||i===Dr)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===Er)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===xr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Tr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Mr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Ar)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Rr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===br)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Cr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Pr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===wr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Lr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===yr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ir)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Dr)return o===tt?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Ur||i===Nr||i===Fr)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===Ur)return o===tt?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Nr)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Fr)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Or||i===Br||i===Gr||i===Hr)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===Or)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Br)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Gr)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Hr)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===kn?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:e}}const qd=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Yd=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class jd{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const i=new Da(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,i=new jt({vertexShader:qd,fragmentShader:Yd,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new It(new Ua(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class $d extends Fo{constructor(t,e){super();const i=this;let r=null,a=1,o=null,s="local-floor",c=1,l=null,d=null,u=null,f=null,_=null,S=null;const R=typeof XRWebGLBinding<"u",m=new jd,h={},T=e.getContextAttributes();let M=null,A=null;const I=[],P=[],D=new vt;let v=null;const x=new An;x.viewport=new pt;const q=new An;q.viewport=new pt;const C=[x,q],G=new Oo;let k=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let Z=I[W];return Z===void 0&&(Z=new mi,I[W]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(W){let Z=I[W];return Z===void 0&&(Z=new mi,I[W]=Z),Z.getGripSpace()},this.getHand=function(W){let Z=I[W];return Z===void 0&&(Z=new mi,I[W]=Z),Z.getHandSpace()};function K(W){const Z=P.indexOf(W.inputSource);if(Z===-1)return;const te=I[Z];te!==void 0&&(te.update(W.inputSource,W.frame,l||o),te.dispatchEvent({type:W.type,data:W.inputSource}))}function F(){r.removeEventListener("select",K),r.removeEventListener("selectstart",K),r.removeEventListener("selectend",K),r.removeEventListener("squeeze",K),r.removeEventListener("squeezestart",K),r.removeEventListener("squeezeend",K),r.removeEventListener("end",F),r.removeEventListener("inputsourceschange",O);for(let W=0;W<I.length;W++){const Z=P[W];Z!==null&&(P[W]=null,I[W].disconnect(Z))}k=null,z=null,m.reset();for(const W in h)delete h[W];t.setRenderTarget(M),_=null,f=null,u=null,r=null,A=null,qe.stop(),i.isPresenting=!1,t.setPixelRatio(v),t.setSize(D.width,D.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){a=W,i.isPresenting===!0&&Qe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){s=W,i.isPresenting===!0&&Qe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(W){l=W},this.getBaseLayer=function(){return f!==null?f:_},this.getBinding=function(){return u===null&&R&&(u=new XRWebGLBinding(r,e)),u},this.getFrame=function(){return S},this.getSession=function(){return r},this.setSession=async function(W){if(r=W,r!==null){if(M=t.getRenderTarget(),r.addEventListener("select",K),r.addEventListener("selectstart",K),r.addEventListener("selectend",K),r.addEventListener("squeeze",K),r.addEventListener("squeezestart",K),r.addEventListener("squeezeend",K),r.addEventListener("end",F),r.addEventListener("inputsourceschange",O),T.xrCompatible!==!0&&await e.makeXRCompatible(),v=t.getPixelRatio(),t.getSize(D),R&&"createProjectionLayer"in XRWebGLBinding.prototype){let te=null,Pe=null,Me=null;T.depth&&(Me=T.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,te=T.stencil?En:Pn,Pe=T.stencil?kn:hn);const be={colorFormat:e.RGBA8,depthFormat:Me,scaleFactor:a};u=this.getBinding(),f=u.createProjectionLayer(be),r.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),A=new Vt(f.textureWidth,f.textureHeight,{format:Kt,type:Bt,depthTexture:new ai(f.textureWidth,f.textureHeight,Pe,void 0,void 0,void 0,void 0,void 0,void 0,te),stencilBuffer:T.stencil,colorSpace:t.outputColorSpace,samples:T.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}else{const te={antialias:T.antialias,alpha:!0,depth:T.depth,stencil:T.stencil,framebufferScaleFactor:a};_=new XRWebGLLayer(r,e,te),r.updateRenderState({baseLayer:_}),t.setPixelRatio(1),t.setSize(_.framebufferWidth,_.framebufferHeight,!1),A=new Vt(_.framebufferWidth,_.framebufferHeight,{format:Kt,type:Bt,colorSpace:t.outputColorSpace,stencilBuffer:T.stencil,resolveDepthBuffer:_.ignoreDepthValues===!1,resolveStencilBuffer:_.ignoreDepthValues===!1})}A.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await r.requestReferenceSpace(s),qe.setContext(r),qe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function O(W){for(let Z=0;Z<W.removed.length;Z++){const te=W.removed[Z],Pe=P.indexOf(te);Pe>=0&&(P[Pe]=null,I[Pe].disconnect(te))}for(let Z=0;Z<W.added.length;Z++){const te=W.added[Z];let Pe=P.indexOf(te);if(Pe===-1){for(let be=0;be<I.length;be++)if(be>=P.length){P.push(te),Pe=be;break}else if(P[be]===null){P[be]=te,Pe=be;break}if(Pe===-1)break}const Me=I[Pe];Me&&Me.connect(te)}}const ne=new Re,ee=new Re;function Te(W,Z,te){ne.setFromMatrixPosition(Z.matrixWorld),ee.setFromMatrixPosition(te.matrixWorld);const Pe=ne.distanceTo(ee),Me=Z.projectionMatrix.elements,be=te.projectionMatrix.elements,ot=Me[14]/(Me[10]-1),Ge=Me[14]/(Me[10]+1),Xe=(Me[9]+1)/Me[5],$e=(Me[9]-1)/Me[5],Ue=(Me[8]-1)/Me[0],st=(be[8]+1)/be[0],b=ot*Ue,ut=ot*st,We=Pe/(-Ue+st),Je=We*-Ue;if(Z.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(Je),W.translateZ(We),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),Me[10]===-1)W.projectionMatrix.copy(Z.projectionMatrix),W.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{const ge=ot+We,E=Ge+We,p=b-Je,L=ut+(Pe-Je),X=Xe*Ge/E*ge,Y=$e*Ge/E*ge;W.projectionMatrix.makePerspective(p,L,X,Y,ge,E),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function Ae(W,Z){Z===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(Z.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(r===null)return;let Z=W.near,te=W.far;m.texture!==null&&(m.depthNear>0&&(Z=m.depthNear),m.depthFar>0&&(te=m.depthFar)),G.near=q.near=x.near=Z,G.far=q.far=x.far=te,(k!==G.near||z!==G.far)&&(r.updateRenderState({depthNear:G.near,depthFar:G.far}),k=G.near,z=G.far),G.layers.mask=W.layers.mask|6,x.layers.mask=G.layers.mask&-5,q.layers.mask=G.layers.mask&-3;const Pe=W.parent,Me=G.cameras;Ae(G,Pe);for(let be=0;be<Me.length;be++)Ae(Me[be],Pe);Me.length===2?Te(G,x,q):G.projectionMatrix.copy(x.projectionMatrix),ue(W,G,Pe)};function ue(W,Z,te){te===null?W.matrix.copy(Z.matrixWorld):(W.matrix.copy(te.matrixWorld),W.matrix.invert(),W.matrix.multiply(Z.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(Z.projectionMatrix),W.projectionMatrixInverse.copy(Z.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=Bo*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return G},this.getFoveation=function(){if(!(f===null&&_===null))return c},this.setFoveation=function(W){c=W,f!==null&&(f.fixedFoveation=W),_!==null&&_.fixedFoveation!==void 0&&(_.fixedFoveation=W)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(G)},this.getCameraTexture=function(W){return h[W]};let Le=null;function nt(W,Z){if(d=Z.getViewerPose(l||o),S=Z,d!==null){const te=d.views;_!==null&&(t.setRenderTargetFramebuffer(A,_.framebuffer),t.setRenderTarget(A));let Pe=!1;te.length!==G.cameras.length&&(G.cameras.length=0,Pe=!0);for(let Ge=0;Ge<te.length;Ge++){const Xe=te[Ge];let $e=null;if(_!==null)$e=_.getViewport(Xe);else{const st=u.getViewSubImage(f,Xe);$e=st.viewport,Ge===0&&(t.setRenderTargetTextures(A,st.colorTexture,st.depthStencilTexture),t.setRenderTarget(A))}let Ue=C[Ge];Ue===void 0&&(Ue=new An,Ue.layers.enable(Ge),Ue.viewport=new pt,C[Ge]=Ue),Ue.matrix.fromArray(Xe.transform.matrix),Ue.matrix.decompose(Ue.position,Ue.quaternion,Ue.scale),Ue.projectionMatrix.fromArray(Xe.projectionMatrix),Ue.projectionMatrixInverse.copy(Ue.projectionMatrix).invert(),Ue.viewport.set($e.x,$e.y,$e.width,$e.height),Ge===0&&(G.matrix.copy(Ue.matrix),G.matrix.decompose(G.position,G.quaternion,G.scale)),Pe===!0&&G.cameras.push(Ue)}const Me=r.enabledFeatures;if(Me&&Me.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&R){u=i.getBinding();const Ge=u.getDepthInformation(te[0]);Ge&&Ge.isValid&&Ge.texture&&m.init(Ge,r.renderState)}if(Me&&Me.includes("camera-access")&&R){t.state.unbindTexture(),u=i.getBinding();for(let Ge=0;Ge<te.length;Ge++){const Xe=te[Ge].camera;if(Xe){let $e=h[Xe];$e||($e=new Da,h[Xe]=$e);const Ue=u.getCameraImage(Xe);$e.sourceTexture=Ue}}}}for(let te=0;te<I.length;te++){const Pe=P[te],Me=I[te];Pe!==null&&Me!==void 0&&Me.update(Pe,Z,l||o)}Le&&Le(W,Z),Z.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Z}),S=null}const qe=new ao;qe.setAnimationLoop(nt),this.setAnimationLoop=function(W){Le=W},this.dispose=function(){}}}const fn=new Xt,Zd=new ke;function Qd(n,t){function e(m,h){m.matrixAutoUpdate===!0&&m.updateMatrix(),h.value.copy(m.matrix)}function i(m,h){h.color.getRGB(m.fogColor.value,Oa(n)),h.isFog?(m.fogNear.value=h.near,m.fogFar.value=h.far):h.isFogExp2&&(m.fogDensity.value=h.density)}function r(m,h,T,M,A){h.isMeshBasicMaterial?a(m,h):h.isMeshLambertMaterial?(a(m,h),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)):h.isMeshToonMaterial?(a(m,h),u(m,h)):h.isMeshPhongMaterial?(a(m,h),d(m,h),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)):h.isMeshStandardMaterial?(a(m,h),f(m,h),h.isMeshPhysicalMaterial&&_(m,h,A)):h.isMeshMatcapMaterial?(a(m,h),S(m,h)):h.isMeshDepthMaterial?a(m,h):h.isMeshDistanceMaterial?(a(m,h),R(m,h)):h.isMeshNormalMaterial?a(m,h):h.isLineBasicMaterial?(o(m,h),h.isLineDashedMaterial&&s(m,h)):h.isPointsMaterial?c(m,h,T,M):h.isSpriteMaterial?l(m,h):h.isShadowMaterial?(m.color.value.copy(h.color),m.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function a(m,h){m.opacity.value=h.opacity,h.color&&m.diffuse.value.copy(h.color),h.emissive&&m.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(m.map.value=h.map,e(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,e(h.alphaMap,m.alphaMapTransform)),h.bumpMap&&(m.bumpMap.value=h.bumpMap,e(h.bumpMap,m.bumpMapTransform),m.bumpScale.value=h.bumpScale,h.side===Rt&&(m.bumpScale.value*=-1)),h.normalMap&&(m.normalMap.value=h.normalMap,e(h.normalMap,m.normalMapTransform),m.normalScale.value.copy(h.normalScale),h.side===Rt&&m.normalScale.value.negate()),h.displacementMap&&(m.displacementMap.value=h.displacementMap,e(h.displacementMap,m.displacementMapTransform),m.displacementScale.value=h.displacementScale,m.displacementBias.value=h.displacementBias),h.emissiveMap&&(m.emissiveMap.value=h.emissiveMap,e(h.emissiveMap,m.emissiveMapTransform)),h.specularMap&&(m.specularMap.value=h.specularMap,e(h.specularMap,m.specularMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);const T=t.get(h),M=T.envMap,A=T.envMapRotation;M&&(m.envMap.value=M,fn.copy(A),fn.x*=-1,fn.y*=-1,fn.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(fn.y*=-1,fn.z*=-1),m.envMapRotation.value.setFromMatrix4(Zd.makeRotationFromEuler(fn)),m.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=h.reflectivity,m.ior.value=h.ior,m.refractionRatio.value=h.refractionRatio),h.lightMap&&(m.lightMap.value=h.lightMap,m.lightMapIntensity.value=h.lightMapIntensity,e(h.lightMap,m.lightMapTransform)),h.aoMap&&(m.aoMap.value=h.aoMap,m.aoMapIntensity.value=h.aoMapIntensity,e(h.aoMap,m.aoMapTransform))}function o(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,h.map&&(m.map.value=h.map,e(h.map,m.mapTransform))}function s(m,h){m.dashSize.value=h.dashSize,m.totalSize.value=h.dashSize+h.gapSize,m.scale.value=h.scale}function c(m,h,T,M){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.size.value=h.size*T,m.scale.value=M*.5,h.map&&(m.map.value=h.map,e(h.map,m.uvTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,e(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function l(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.rotation.value=h.rotation,h.map&&(m.map.value=h.map,e(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,e(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function d(m,h){m.specular.value.copy(h.specular),m.shininess.value=Math.max(h.shininess,1e-4)}function u(m,h){h.gradientMap&&(m.gradientMap.value=h.gradientMap)}function f(m,h){m.metalness.value=h.metalness,h.metalnessMap&&(m.metalnessMap.value=h.metalnessMap,e(h.metalnessMap,m.metalnessMapTransform)),m.roughness.value=h.roughness,h.roughnessMap&&(m.roughnessMap.value=h.roughnessMap,e(h.roughnessMap,m.roughnessMapTransform)),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)}function _(m,h,T){m.ior.value=h.ior,h.sheen>0&&(m.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),m.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(m.sheenColorMap.value=h.sheenColorMap,e(h.sheenColorMap,m.sheenColorMapTransform)),h.sheenRoughnessMap&&(m.sheenRoughnessMap.value=h.sheenRoughnessMap,e(h.sheenRoughnessMap,m.sheenRoughnessMapTransform))),h.clearcoat>0&&(m.clearcoat.value=h.clearcoat,m.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(m.clearcoatMap.value=h.clearcoatMap,e(h.clearcoatMap,m.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,e(h.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(m.clearcoatNormalMap.value=h.clearcoatNormalMap,e(h.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Rt&&m.clearcoatNormalScale.value.negate())),h.dispersion>0&&(m.dispersion.value=h.dispersion),h.iridescence>0&&(m.iridescence.value=h.iridescence,m.iridescenceIOR.value=h.iridescenceIOR,m.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(m.iridescenceMap.value=h.iridescenceMap,e(h.iridescenceMap,m.iridescenceMapTransform)),h.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=h.iridescenceThicknessMap,e(h.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),h.transmission>0&&(m.transmission.value=h.transmission,m.transmissionSamplerMap.value=T.texture,m.transmissionSamplerSize.value.set(T.width,T.height),h.transmissionMap&&(m.transmissionMap.value=h.transmissionMap,e(h.transmissionMap,m.transmissionMapTransform)),m.thickness.value=h.thickness,h.thicknessMap&&(m.thicknessMap.value=h.thicknessMap,e(h.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=h.attenuationDistance,m.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(m.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(m.anisotropyMap.value=h.anisotropyMap,e(h.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=h.specularIntensity,m.specularColor.value.copy(h.specularColor),h.specularColorMap&&(m.specularColorMap.value=h.specularColorMap,e(h.specularColorMap,m.specularColorMapTransform)),h.specularIntensityMap&&(m.specularIntensityMap.value=h.specularIntensityMap,e(h.specularIntensityMap,m.specularIntensityMapTransform))}function S(m,h){h.matcap&&(m.matcap.value=h.matcap)}function R(m,h){const T=t.get(h).light;m.referencePosition.value.setFromMatrixPosition(T.matrixWorld),m.nearDistance.value=T.shadow.camera.near,m.farDistance.value=T.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function Jd(n,t,e,i){let r={},a={},o=[];const s=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(T,M){const A=M.program;i.uniformBlockBinding(T,A)}function l(T,M){let A=r[T.id];A===void 0&&(S(T),A=d(T),r[T.id]=A,T.addEventListener("dispose",m));const I=M.program;i.updateUBOMapping(T,I);const P=t.render.frame;a[T.id]!==P&&(f(T),a[T.id]=P)}function d(T){const M=u();T.__bindingPointIndex=M;const A=n.createBuffer(),I=T.__size,P=T.usage;return n.bindBuffer(n.UNIFORM_BUFFER,A),n.bufferData(n.UNIFORM_BUFFER,I,P),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,M,A),A}function u(){for(let T=0;T<s;T++)if(o.indexOf(T)===-1)return o.push(T),T;return it("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(T){const M=r[T.id],A=T.uniforms,I=T.__cache;n.bindBuffer(n.UNIFORM_BUFFER,M);for(let P=0,D=A.length;P<D;P++){const v=Array.isArray(A[P])?A[P]:[A[P]];for(let x=0,q=v.length;x<q;x++){const C=v[x];if(_(C,P,x,I)===!0){const G=C.__offset,k=Array.isArray(C.value)?C.value:[C.value];let z=0;for(let K=0;K<k.length;K++){const F=k[K],O=R(F);typeof F=="number"||typeof F=="boolean"?(C.__data[0]=F,n.bufferSubData(n.UNIFORM_BUFFER,G+z,C.__data)):F.isMatrix3?(C.__data[0]=F.elements[0],C.__data[1]=F.elements[1],C.__data[2]=F.elements[2],C.__data[3]=0,C.__data[4]=F.elements[3],C.__data[5]=F.elements[4],C.__data[6]=F.elements[5],C.__data[7]=0,C.__data[8]=F.elements[6],C.__data[9]=F.elements[7],C.__data[10]=F.elements[8],C.__data[11]=0):(F.toArray(C.__data,z),z+=O.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,G,C.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function _(T,M,A,I){const P=T.value,D=M+"_"+A;if(I[D]===void 0)return typeof P=="number"||typeof P=="boolean"?I[D]=P:I[D]=P.clone(),!0;{const v=I[D];if(typeof P=="number"||typeof P=="boolean"){if(v!==P)return I[D]=P,!0}else if(v.equals(P)===!1)return v.copy(P),!0}return!1}function S(T){const M=T.uniforms;let A=0;const I=16;for(let D=0,v=M.length;D<v;D++){const x=Array.isArray(M[D])?M[D]:[M[D]];for(let q=0,C=x.length;q<C;q++){const G=x[q],k=Array.isArray(G.value)?G.value:[G.value];for(let z=0,K=k.length;z<K;z++){const F=k[z],O=R(F),ne=A%I,ee=ne%O.boundary,Te=ne+ee;A+=ee,Te!==0&&I-Te<O.storage&&(A+=I-Te),G.__data=new Float32Array(O.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=A,A+=O.storage}}}const P=A%I;return P>0&&(A+=I-P),T.__size=A,T.__cache={},this}function R(T){const M={boundary:0,storage:0};return typeof T=="number"||typeof T=="boolean"?(M.boundary=4,M.storage=4):T.isVector2?(M.boundary=8,M.storage=8):T.isVector3||T.isColor?(M.boundary=16,M.storage=12):T.isVector4?(M.boundary=16,M.storage=16):T.isMatrix3?(M.boundary=48,M.storage=48):T.isMatrix4?(M.boundary=64,M.storage=64):T.isTexture?Qe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):Qe("WebGLRenderer: Unsupported uniform value type.",T),M}function m(T){const M=T.target;M.removeEventListener("dispose",m);const A=o.indexOf(M.__bindingPointIndex);o.splice(A,1),n.deleteBuffer(r[M.id]),delete r[M.id],delete a[M.id]}function h(){for(const T in r)n.deleteBuffer(r[T]);o=[],r={},a={}}return{bind:c,update:l,dispose:h}}const ep=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Ut=null;function tp(){return Ut===null&&(Ut=new Go(ep,16,16,zn,on),Ut.name="DFG_LUT",Ut.minFilter=xt,Ut.magFilter=xt,Ut.wrapS=wn,Ut.wrapT=wn,Ut.generateMipmaps=!1,Ut.needsUpdate=!0),Ut}class vh{constructor(t={}){const{canvas:e=Io(),context:i=null,depth:r=!0,stencil:a=!1,alpha:o=!1,antialias:s=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1,outputBufferType:_=Bt}=t;this.isWebGLRenderer=!0;let S;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");S=i.getContextAttributes().alpha}else S=o;const R=_,m=new Set([Pa,wa,La]),h=new Set([Bt,hn,oi,kn,ya,Ia]),T=new Uint32Array(4),M=new Int32Array(4);let A=null,I=null;const P=[],D=[];let v=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ht,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const x=this;let q=!1;this._outputColorSpace=dt;let C=0,G=0,k=null,z=-1,K=null;const F=new pt,O=new pt;let ne=null;const ee=new De(0);let Te=0,Ae=e.width,ue=e.height,Le=1,nt=null,qe=null;const W=new pt(0,0,Ae,ue),Z=new pt(0,0,Ae,ue);let te=!1;const Pe=new Aa;let Me=!1,be=!1;const ot=new ke,Ge=new Re,Xe=new pt,$e={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ue=!1;function st(){return k===null?Le:1}let b=i;function ut(g,y){return e.getContext(g,y)}try{const g={alpha:!0,depth:r,stencil:a,antialias:s,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:d,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Do}`),e.addEventListener("webglcontextlost",he,!1),e.addEventListener("webglcontextrestored",we,!1),e.addEventListener("webglcontextcreationerror",et,!1),b===null){const y="webgl2";if(b=ut(y,g),b===null)throw ut(y)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(g){throw it("WebGLRenderer: "+g.message),g}let We,Je,ge,E,p,L,X,Y,V,de,ie,xe,Ce,j,Q,pe,me,ce,Ne,w,re,J,fe;function $(){We=new nu(b),We.init(),re=new Kd(b,We),Je=new Yf(b,We,t,re),ge=new Wd(b,We),Je.reversedDepthBuffer&&f&&ge.buffers.depth.setReversed(!0),E=new au(b),p=new Ld,L=new Xd(b,We,ge,p,Je,re,E),X=new tu(x),Y=new lc(b),J=new Kf(b,Y),V=new iu(b,Y,E,J),de=new su(b,V,Y,J,E),ce=new ou(b,Je,L),Q=new jf(p),ie=new wd(x,X,We,Je,J,Q),xe=new Qd(x,p),Ce=new Id,j=new Bd(We),me=new Xf(x,X,ge,de,S,c),pe=new zd(x,de,Je),fe=new Jd(b,E,Je,ge),Ne=new qf(b,We,E),w=new ru(b,We,E),E.programs=ie.programs,x.capabilities=Je,x.extensions=We,x.properties=p,x.renderLists=Ce,x.shadowMap=pe,x.state=ge,x.info=E}$(),R!==Bt&&(v=new lu(R,e.width,e.height,r,a));const H=new $d(x,b);this.xr=H,this.getContext=function(){return b},this.getContextAttributes=function(){return b.getContextAttributes()},this.forceContextLoss=function(){const g=We.get("WEBGL_lose_context");g&&g.loseContext()},this.forceContextRestore=function(){const g=We.get("WEBGL_lose_context");g&&g.restoreContext()},this.getPixelRatio=function(){return Le},this.setPixelRatio=function(g){g!==void 0&&(Le=g,this.setSize(Ae,ue,!1))},this.getSize=function(g){return g.set(Ae,ue)},this.setSize=function(g,y,B=!0){if(H.isPresenting){Qe("WebGLRenderer: Can't change size while VR device is presenting.");return}Ae=g,ue=y,e.width=Math.floor(g*Le),e.height=Math.floor(y*Le),B===!0&&(e.style.width=g+"px",e.style.height=y+"px"),v!==null&&v.setSize(e.width,e.height),this.setViewport(0,0,g,y)},this.getDrawingBufferSize=function(g){return g.set(Ae*Le,ue*Le).floor()},this.setDrawingBufferSize=function(g,y,B){Ae=g,ue=y,Le=B,e.width=Math.floor(g*B),e.height=Math.floor(y*B),this.setViewport(0,0,g,y)},this.setEffects=function(g){if(R===Bt){console.error("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(g){for(let y=0;y<g.length;y++)if(g[y].isOutputPass===!0){console.warn("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}v.setEffects(g||[])},this.getCurrentViewport=function(g){return g.copy(F)},this.getViewport=function(g){return g.copy(W)},this.setViewport=function(g,y,B,N){g.isVector4?W.set(g.x,g.y,g.z,g.w):W.set(g,y,B,N),ge.viewport(F.copy(W).multiplyScalar(Le).round())},this.getScissor=function(g){return g.copy(Z)},this.setScissor=function(g,y,B,N){g.isVector4?Z.set(g.x,g.y,g.z,g.w):Z.set(g,y,B,N),ge.scissor(O.copy(Z).multiplyScalar(Le).round())},this.getScissorTest=function(){return te},this.setScissorTest=function(g){ge.setScissorTest(te=g)},this.setOpaqueSort=function(g){nt=g},this.setTransparentSort=function(g){qe=g},this.getClearColor=function(g){return g.copy(me.getClearColor())},this.setClearColor=function(){me.setClearColor(...arguments)},this.getClearAlpha=function(){return me.getClearAlpha()},this.setClearAlpha=function(){me.setClearAlpha(...arguments)},this.clear=function(g=!0,y=!0,B=!0){let N=0;if(g){let U=!1;if(k!==null){const oe=k.texture.format;U=m.has(oe)}if(U){const oe=k.texture.type,le=h.has(oe),se=me.getClearColor(),_e=me.getClearAlpha(),Se=se.r,ye=se.g,Fe=se.b;le?(T[0]=Se,T[1]=ye,T[2]=Fe,T[3]=_e,b.clearBufferuiv(b.COLOR,0,T)):(M[0]=Se,M[1]=ye,M[2]=Fe,M[3]=_e,b.clearBufferiv(b.COLOR,0,M))}else N|=b.COLOR_BUFFER_BIT}y&&(N|=b.DEPTH_BUFFER_BIT),B&&(N|=b.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N!==0&&b.clear(N)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",he,!1),e.removeEventListener("webglcontextrestored",we,!1),e.removeEventListener("webglcontextcreationerror",et,!1),me.dispose(),Ce.dispose(),j.dispose(),p.dispose(),X.dispose(),de.dispose(),J.dispose(),fe.dispose(),ie.dispose(),H.dispose(),H.removeEventListener("sessionstart",Qi),H.removeEventListener("sessionend",Ji),sn.stop()};function he(g){g.preventDefault(),or("WebGLRenderer: Context Lost."),q=!0}function we(){or("WebGLRenderer: Context Restored."),q=!1;const g=E.autoReset,y=pe.enabled,B=pe.autoUpdate,N=pe.needsUpdate,U=pe.type;$(),E.autoReset=g,pe.enabled=y,pe.autoUpdate=B,pe.needsUpdate=N,pe.type=U}function et(g){it("WebGLRenderer: A WebGL context could not be created. Reason: ",g.statusMessage)}function Ke(g){const y=g.target;y.removeEventListener("dispose",Ke),zt(y)}function zt(g){Wt(g),p.remove(g)}function Wt(g){const y=p.get(g).programs;y!==void 0&&(y.forEach(function(B){ie.releaseProgram(B)}),g.isShaderMaterial&&ie.releaseShaderCache(g))}this.renderBufferDirect=function(g,y,B,N,U,oe){y===null&&(y=$e);const le=U.isMesh&&U.matrixWorld.determinant()<0,se=bo(g,y,B,N,U);ge.setMaterial(N,le);let _e=B.index,Se=1;if(N.wireframe===!0){if(_e=V.getWireframeAttribute(B),_e===void 0)return;Se=2}const ye=B.drawRange,Fe=B.attributes.position;let Ee=ye.start*Se,Ye=(ye.start+ye.count)*Se;oe!==null&&(Ee=Math.max(Ee,oe.start*Se),Ye=Math.min(Ye,(oe.start+oe.count)*Se)),_e!==null?(Ee=Math.max(Ee,0),Ye=Math.min(Ye,_e.count)):Fe!=null&&(Ee=Math.max(Ee,0),Ye=Math.min(Ye,Fe.count));const ct=Ye-Ee;if(ct<0||ct===1/0)return;J.setup(U,N,se,B,_e);let at,je=Ne;if(_e!==null&&(at=Y.get(_e),je=w,je.setIndex(at)),U.isMesh)N.wireframe===!0?(ge.setLineWidth(N.wireframeLinewidth*st()),je.setMode(b.LINES)):je.setMode(b.TRIANGLES);else if(U.isLine){let St=N.linewidth;St===void 0&&(St=1),ge.setLineWidth(St*st()),U.isLineSegments?je.setMode(b.LINES):U.isLineLoop?je.setMode(b.LINE_LOOP):je.setMode(b.LINE_STRIP)}else U.isPoints?je.setMode(b.POINTS):U.isSprite&&je.setMode(b.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)Ra("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),je.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(We.get("WEBGL_multi_draw"))je.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const St=U._multiDrawStarts,ve=U._multiDrawCounts,At=U._multiDrawCount,Ve=_e?Y.get(_e).bytesPerElement:1,wt=p.get(N).currentProgram.getUniforms();for(let Dt=0;Dt<At;Dt++)wt.setValue(b,"_gl_DrawID",Dt),je.render(St[Dt]/Ve,ve[Dt])}else if(U.isInstancedMesh)je.renderInstances(Ee,ct,U.count);else if(B.isInstancedBufferGeometry){const St=B._maxInstanceCount!==void 0?B._maxInstanceCount:1/0,ve=Math.min(B.instanceCount,St);je.renderInstances(Ee,ct,ve)}else je.render(Ee,ct)};function Zi(g,y,B){g.transparent===!0&&g.side===Gt&&g.forceSinglePass===!1?(g.side=Rt,g.needsUpdate=!0,jn(g,y,B),g.side=Cn,g.needsUpdate=!0,jn(g,y,B),g.side=Gt):jn(g,y,B)}this.compile=function(g,y,B=null){B===null&&(B=g),I=j.get(B),I.init(y),D.push(I),B.traverseVisible(function(U){U.isLight&&U.layers.test(y.layers)&&(I.pushLight(U),U.castShadow&&I.pushShadow(U))}),g!==B&&g.traverseVisible(function(U){U.isLight&&U.layers.test(y.layers)&&(I.pushLight(U),U.castShadow&&I.pushShadow(U))}),I.setupLights();const N=new Set;return g.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const oe=U.material;if(oe)if(Array.isArray(oe))for(let le=0;le<oe.length;le++){const se=oe[le];Zi(se,B,U),N.add(se)}else Zi(oe,B,U),N.add(oe)}),I=D.pop(),N},this.compileAsync=function(g,y,B=null){const N=this.compile(g,y,B);return new Promise(U=>{function oe(){if(N.forEach(function(le){p.get(le).currentProgram.isReady()&&N.delete(le)}),N.size===0){U(g);return}setTimeout(oe,10)}We.get("KHR_parallel_shader_compile")!==null?oe():setTimeout(oe,10)})};let pi=null;function Ro(g){pi&&pi(g)}function Qi(){sn.stop()}function Ji(){sn.start()}const sn=new ao;sn.setAnimationLoop(Ro),typeof self<"u"&&sn.setContext(self),this.setAnimationLoop=function(g){pi=g,H.setAnimationLoop(g),g===null?sn.stop():sn.start()},H.addEventListener("sessionstart",Qi),H.addEventListener("sessionend",Ji),this.render=function(g,y){if(y!==void 0&&y.isCamera!==!0){it("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(q===!0)return;const B=H.enabled===!0&&H.isPresenting===!0,N=v!==null&&(k===null||B)&&v.begin(x,k);if(g.matrixWorldAutoUpdate===!0&&g.updateMatrixWorld(),y.parent===null&&y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),H.enabled===!0&&H.isPresenting===!0&&(v===null||v.isCompositing()===!1)&&(H.cameraAutoUpdate===!0&&H.updateCamera(y),y=H.getCamera()),g.isScene===!0&&g.onBeforeRender(x,g,y,k),I=j.get(g,D.length),I.init(y),D.push(I),ot.multiplyMatrices(y.projectionMatrix,y.matrixWorldInverse),Pe.setFromProjectionMatrix(ot,sr,y.reversedDepth),be=this.localClippingEnabled,Me=Q.init(this.clippingPlanes,be),A=Ce.get(g,P.length),A.init(),P.push(A),H.enabled===!0&&H.isPresenting===!0){const le=x.xr.getDepthSensingMesh();le!==null&&hi(le,y,-1/0,x.sortObjects)}hi(g,y,0,x.sortObjects),A.finish(),x.sortObjects===!0&&A.sort(nt,qe),Ue=H.enabled===!1||H.isPresenting===!1||H.hasDepthSensing()===!1,Ue&&me.addToRenderList(A,g),this.info.render.frame++,Me===!0&&Q.beginShadows();const U=I.state.shadowsArray;if(pe.render(U,g,y),Me===!0&&Q.endShadows(),this.info.autoReset===!0&&this.info.reset(),(N&&v.hasRenderPass())===!1){const le=A.opaque,se=A.transmissive;if(I.setupLights(),y.isArrayCamera){const _e=y.cameras;if(se.length>0)for(let Se=0,ye=_e.length;Se<ye;Se++){const Fe=_e[Se];tr(le,se,g,Fe)}Ue&&me.render(g);for(let Se=0,ye=_e.length;Se<ye;Se++){const Fe=_e[Se];er(A,g,Fe,Fe.viewport)}}else se.length>0&&tr(le,se,g,y),Ue&&me.render(g),er(A,g,y)}k!==null&&G===0&&(L.updateMultisampleRenderTarget(k),L.updateRenderTargetMipmap(k)),N&&v.end(x),g.isScene===!0&&g.onAfterRender(x,g,y),J.resetDefaultState(),z=-1,K=null,D.pop(),D.length>0?(I=D[D.length-1],Me===!0&&Q.setGlobalState(x.clippingPlanes,I.state.camera)):I=null,P.pop(),P.length>0?A=P[P.length-1]:A=null};function hi(g,y,B,N){if(g.visible===!1)return;if(g.layers.test(y.layers)){if(g.isGroup)B=g.renderOrder;else if(g.isLOD)g.autoUpdate===!0&&g.update(y);else if(g.isLight)I.pushLight(g),g.castShadow&&I.pushShadow(g);else if(g.isSprite){if(!g.frustumCulled||Pe.intersectsSprite(g)){N&&Xe.setFromMatrixPosition(g.matrixWorld).applyMatrix4(ot);const le=de.update(g),se=g.material;se.visible&&A.push(g,le,se,B,Xe.z,null)}}else if((g.isMesh||g.isLine||g.isPoints)&&(!g.frustumCulled||Pe.intersectsObject(g))){const le=de.update(g),se=g.material;if(N&&(g.boundingSphere!==void 0?(g.boundingSphere===null&&g.computeBoundingSphere(),Xe.copy(g.boundingSphere.center)):(le.boundingSphere===null&&le.computeBoundingSphere(),Xe.copy(le.boundingSphere.center)),Xe.applyMatrix4(g.matrixWorld).applyMatrix4(ot)),Array.isArray(se)){const _e=le.groups;for(let Se=0,ye=_e.length;Se<ye;Se++){const Fe=_e[Se],Ee=se[Fe.materialIndex];Ee&&Ee.visible&&A.push(g,le,Ee,B,Xe.z,Fe)}}else se.visible&&A.push(g,le,se,B,Xe.z,null)}}const oe=g.children;for(let le=0,se=oe.length;le<se;le++)hi(oe[le],y,B,N)}function er(g,y,B,N){const{opaque:U,transmissive:oe,transparent:le}=g;I.setupLightsView(B),Me===!0&&Q.setGlobalState(x.clippingPlanes,B),N&&ge.viewport(F.copy(N)),U.length>0&&Yn(U,y,B),oe.length>0&&Yn(oe,y,B),le.length>0&&Yn(le,y,B),ge.buffers.depth.setTest(!0),ge.buffers.depth.setMask(!0),ge.buffers.color.setMask(!0),ge.setPolygonOffset(!1)}function tr(g,y,B,N){if((B.isScene===!0?B.overrideMaterial:null)!==null)return;if(I.state.transmissionRenderTarget[N.id]===void 0){const Ee=We.has("EXT_color_buffer_half_float")||We.has("EXT_color_buffer_float");I.state.transmissionRenderTarget[N.id]=new Vt(1,1,{generateMipmaps:!0,type:Ee?on:Bt,minFilter:tn,samples:Math.max(4,Je.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ze.workingColorSpace})}const oe=I.state.transmissionRenderTarget[N.id],le=N.viewport||F;oe.setSize(le.z*x.transmissionResolutionScale,le.w*x.transmissionResolutionScale);const se=x.getRenderTarget(),_e=x.getActiveCubeFace(),Se=x.getActiveMipmapLevel();x.setRenderTarget(oe),x.getClearColor(ee),Te=x.getClearAlpha(),Te<1&&x.setClearColor(16777215,.5),x.clear(),Ue&&me.render(B);const ye=x.toneMapping;x.toneMapping=Ht;const Fe=N.viewport;if(N.viewport!==void 0&&(N.viewport=void 0),I.setupLightsView(N),Me===!0&&Q.setGlobalState(x.clippingPlanes,N),Yn(g,B,N),L.updateMultisampleRenderTarget(oe),L.updateRenderTargetMipmap(oe),We.has("WEBGL_multisampled_render_to_texture")===!1){let Ee=!1;for(let Ye=0,ct=y.length;Ye<ct;Ye++){const at=y[Ye],{object:je,geometry:St,material:ve,group:At}=at;if(ve.side===Gt&&je.layers.test(N.layers)){const Ve=ve.side;ve.side=Rt,ve.needsUpdate=!0,nr(je,B,N,St,ve,At),ve.side=Ve,ve.needsUpdate=!0,Ee=!0}}Ee===!0&&(L.updateMultisampleRenderTarget(oe),L.updateRenderTargetMipmap(oe))}x.setRenderTarget(se,_e,Se),x.setClearColor(ee,Te),Fe!==void 0&&(N.viewport=Fe),x.toneMapping=ye}function Yn(g,y,B){const N=y.isScene===!0?y.overrideMaterial:null;for(let U=0,oe=g.length;U<oe;U++){const le=g[U],{object:se,geometry:_e,group:Se}=le;let ye=le.material;ye.allowOverride===!0&&N!==null&&(ye=N),se.layers.test(B.layers)&&nr(se,y,B,_e,ye,Se)}}function nr(g,y,B,N,U,oe){g.onBeforeRender(x,y,B,N,U,oe),g.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,g.matrixWorld),g.normalMatrix.getNormalMatrix(g.modelViewMatrix),U.onBeforeRender(x,y,B,N,g,oe),U.transparent===!0&&U.side===Gt&&U.forceSinglePass===!1?(U.side=Rt,U.needsUpdate=!0,x.renderBufferDirect(B,y,N,U,g,oe),U.side=Cn,U.needsUpdate=!0,x.renderBufferDirect(B,y,N,U,g,oe),U.side=Gt):x.renderBufferDirect(B,y,N,U,g,oe),g.onAfterRender(x,y,B,N,U,oe)}function jn(g,y,B){y.isScene!==!0&&(y=$e);const N=p.get(g),U=I.state.lights,oe=I.state.shadowsArray,le=U.state.version,se=ie.getParameters(g,U.state,oe,y,B),_e=ie.getProgramCacheKey(se);let Se=N.programs;N.environment=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?y.environment:null,N.fog=y.fog;const ye=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap;N.envMap=X.get(g.envMap||N.environment,ye),N.envMapRotation=N.environment!==null&&g.envMap===null?y.environmentRotation:g.envMapRotation,Se===void 0&&(g.addEventListener("dispose",Ke),Se=new Map,N.programs=Se);let Fe=Se.get(_e);if(Fe!==void 0){if(N.currentProgram===Fe&&N.lightsStateVersion===le)return rr(g,se),Fe}else se.uniforms=ie.getUniforms(g),g.onBeforeCompile(se,x),Fe=ie.acquireProgram(se,_e),Se.set(_e,Fe),N.uniforms=se.uniforms;const Ee=N.uniforms;return(!g.isShaderMaterial&&!g.isRawShaderMaterial||g.clipping===!0)&&(Ee.clippingPlanes=Q.uniform),rr(g,se),N.needsLights=Po(g),N.lightsStateVersion=le,N.needsLights&&(Ee.ambientLightColor.value=U.state.ambient,Ee.lightProbe.value=U.state.probe,Ee.directionalLights.value=U.state.directional,Ee.directionalLightShadows.value=U.state.directionalShadow,Ee.spotLights.value=U.state.spot,Ee.spotLightShadows.value=U.state.spotShadow,Ee.rectAreaLights.value=U.state.rectArea,Ee.ltc_1.value=U.state.rectAreaLTC1,Ee.ltc_2.value=U.state.rectAreaLTC2,Ee.pointLights.value=U.state.point,Ee.pointLightShadows.value=U.state.pointShadow,Ee.hemisphereLights.value=U.state.hemi,Ee.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Ee.spotLightMatrix.value=U.state.spotLightMatrix,Ee.spotLightMap.value=U.state.spotLightMap,Ee.pointShadowMatrix.value=U.state.pointShadowMatrix),N.currentProgram=Fe,N.uniformsList=null,Fe}function ir(g){if(g.uniformsList===null){const y=g.currentProgram.getUniforms();g.uniformsList=ri.seqWithValue(y.seq,g.uniforms)}return g.uniformsList}function rr(g,y){const B=p.get(g);B.outputColorSpace=y.outputColorSpace,B.batching=y.batching,B.batchingColor=y.batchingColor,B.instancing=y.instancing,B.instancingColor=y.instancingColor,B.instancingMorph=y.instancingMorph,B.skinning=y.skinning,B.morphTargets=y.morphTargets,B.morphNormals=y.morphNormals,B.morphColors=y.morphColors,B.morphTargetsCount=y.morphTargetsCount,B.numClippingPlanes=y.numClippingPlanes,B.numIntersection=y.numClipIntersection,B.vertexAlphas=y.vertexAlphas,B.vertexTangents=y.vertexTangents,B.toneMapping=y.toneMapping}function bo(g,y,B,N,U){y.isScene!==!0&&(y=$e),L.resetTextureUnits();const oe=y.fog,le=N.isMeshStandardMaterial||N.isMeshLambertMaterial||N.isMeshPhongMaterial?y.environment:null,se=k===null?x.outputColorSpace:k.isXRRenderTarget===!0?k.texture.colorSpace:bt,_e=N.isMeshStandardMaterial||N.isMeshLambertMaterial&&!N.envMap||N.isMeshPhongMaterial&&!N.envMap,Se=X.get(N.envMap||le,_e),ye=N.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,Fe=!!B.attributes.tangent&&(!!N.normalMap||N.anisotropy>0),Ee=!!B.morphAttributes.position,Ye=!!B.morphAttributes.normal,ct=!!B.morphAttributes.color;let at=Ht;N.toneMapped&&(k===null||k.isXRRenderTarget===!0)&&(at=x.toneMapping);const je=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,St=je!==void 0?je.length:0,ve=p.get(N),At=I.state.lights;if(Me===!0&&(be===!0||g!==K)){const _t=g===K&&N.id===z;Q.setState(N,g,_t)}let Ve=!1;N.version===ve.__version?(ve.needsLights&&ve.lightsStateVersion!==At.state.version||ve.outputColorSpace!==se||U.isBatchedMesh&&ve.batching===!1||!U.isBatchedMesh&&ve.batching===!0||U.isBatchedMesh&&ve.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&ve.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&ve.instancing===!1||!U.isInstancedMesh&&ve.instancing===!0||U.isSkinnedMesh&&ve.skinning===!1||!U.isSkinnedMesh&&ve.skinning===!0||U.isInstancedMesh&&ve.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&ve.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&ve.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&ve.instancingMorph===!1&&U.morphTexture!==null||ve.envMap!==Se||N.fog===!0&&ve.fog!==oe||ve.numClippingPlanes!==void 0&&(ve.numClippingPlanes!==Q.numPlanes||ve.numIntersection!==Q.numIntersection)||ve.vertexAlphas!==ye||ve.vertexTangents!==Fe||ve.morphTargets!==Ee||ve.morphNormals!==Ye||ve.morphColors!==ct||ve.toneMapping!==at||ve.morphTargetsCount!==St)&&(Ve=!0):(Ve=!0,ve.__version=N.version);let wt=ve.currentProgram;Ve===!0&&(wt=jn(N,y,U));let Dt=!1,cn=!1,mn=!1;const Ze=wt.getUniforms(),gt=ve.uniforms;if(ge.useProgram(wt.program)&&(Dt=!0,cn=!0,mn=!0),N.id!==z&&(z=N.id,cn=!0),Dt||K!==g){ge.buffers.depth.getReversed()&&g.reversedDepth!==!0&&(g._reversedDepth=!0,g.updateProjectionMatrix()),Ze.setValue(b,"projectionMatrix",g.projectionMatrix),Ze.setValue(b,"viewMatrix",g.matrixWorldInverse);const Zt=Ze.map.cameraPosition;Zt!==void 0&&Zt.setValue(b,Ge.setFromMatrixPosition(g.matrixWorld)),Je.logarithmicDepthBuffer&&Ze.setValue(b,"logDepthBufFC",2/(Math.log(g.far+1)/Math.LN2)),(N.isMeshPhongMaterial||N.isMeshToonMaterial||N.isMeshLambertMaterial||N.isMeshBasicMaterial||N.isMeshStandardMaterial||N.isShaderMaterial)&&Ze.setValue(b,"isOrthographic",g.isOrthographicCamera===!0),K!==g&&(K=g,cn=!0,mn=!0)}if(ve.needsLights&&(At.state.directionalShadowMap.length>0&&Ze.setValue(b,"directionalShadowMap",At.state.directionalShadowMap,L),At.state.spotShadowMap.length>0&&Ze.setValue(b,"spotShadowMap",At.state.spotShadowMap,L),At.state.pointShadowMap.length>0&&Ze.setValue(b,"pointShadowMap",At.state.pointShadowMap,L)),U.isSkinnedMesh){Ze.setOptional(b,U,"bindMatrix"),Ze.setOptional(b,U,"bindMatrixInverse");const _t=U.skeleton;_t&&(_t.boneTexture===null&&_t.computeBoneTexture(),Ze.setValue(b,"boneTexture",_t.boneTexture,L))}U.isBatchedMesh&&(Ze.setOptional(b,U,"batchingTexture"),Ze.setValue(b,"batchingTexture",U._matricesTexture,L),Ze.setOptional(b,U,"batchingIdTexture"),Ze.setValue(b,"batchingIdTexture",U._indirectTexture,L),Ze.setOptional(b,U,"batchingColorTexture"),U._colorsTexture!==null&&Ze.setValue(b,"batchingColorTexture",U._colorsTexture,L));const $t=B.morphAttributes;if(($t.position!==void 0||$t.normal!==void 0||$t.color!==void 0)&&ce.update(U,B,wt),(cn||ve.receiveShadow!==U.receiveShadow)&&(ve.receiveShadow=U.receiveShadow,Ze.setValue(b,"receiveShadow",U.receiveShadow)),(N.isMeshStandardMaterial||N.isMeshLambertMaterial||N.isMeshPhongMaterial)&&N.envMap===null&&y.environment!==null&&(gt.envMapIntensity.value=y.environmentIntensity),gt.dfgLUT!==void 0&&(gt.dfgLUT.value=tp()),cn&&(Ze.setValue(b,"toneMappingExposure",x.toneMappingExposure),ve.needsLights&&Co(gt,mn),oe&&N.fog===!0&&xe.refreshFogUniforms(gt,oe),xe.refreshMaterialUniforms(gt,N,Le,ue,I.state.transmissionRenderTarget[g.id]),ri.upload(b,ir(ve),gt,L)),N.isShaderMaterial&&N.uniformsNeedUpdate===!0&&(ri.upload(b,ir(ve),gt,L),N.uniformsNeedUpdate=!1),N.isSpriteMaterial&&Ze.setValue(b,"center",U.center),Ze.setValue(b,"modelViewMatrix",U.modelViewMatrix),Ze.setValue(b,"normalMatrix",U.normalMatrix),Ze.setValue(b,"modelMatrix",U.matrixWorld),N.isShaderMaterial||N.isRawShaderMaterial){const _t=N.uniformsGroups;for(let Zt=0,_n=_t.length;Zt<_n;Zt++){const ar=_t[Zt];fe.update(ar,wt),fe.bind(ar,wt)}}return wt}function Co(g,y){g.ambientLightColor.needsUpdate=y,g.lightProbe.needsUpdate=y,g.directionalLights.needsUpdate=y,g.directionalLightShadows.needsUpdate=y,g.pointLights.needsUpdate=y,g.pointLightShadows.needsUpdate=y,g.spotLights.needsUpdate=y,g.spotLightShadows.needsUpdate=y,g.rectAreaLights.needsUpdate=y,g.hemisphereLights.needsUpdate=y}function Po(g){return g.isMeshLambertMaterial||g.isMeshToonMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isShadowMaterial||g.isShaderMaterial&&g.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return G},this.getRenderTarget=function(){return k},this.setRenderTargetTextures=function(g,y,B){const N=p.get(g);N.__autoAllocateDepthBuffer=g.resolveDepthBuffer===!1,N.__autoAllocateDepthBuffer===!1&&(N.__useRenderToTexture=!1),p.get(g.texture).__webglTexture=y,p.get(g.depthTexture).__webglTexture=N.__autoAllocateDepthBuffer?void 0:B,N.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(g,y){const B=p.get(g);B.__webglFramebuffer=y,B.__useDefaultFramebuffer=y===void 0};const wo=b.createFramebuffer();this.setRenderTarget=function(g,y=0,B=0){k=g,C=y,G=B;let N=null,U=!1,oe=!1;if(g){const se=p.get(g);if(se.__useDefaultFramebuffer!==void 0){ge.bindFramebuffer(b.FRAMEBUFFER,se.__webglFramebuffer),F.copy(g.viewport),O.copy(g.scissor),ne=g.scissorTest,ge.viewport(F),ge.scissor(O),ge.setScissorTest(ne),z=-1;return}else if(se.__webglFramebuffer===void 0)L.setupRenderTarget(g);else if(se.__hasExternalTextures)L.rebindTextures(g,p.get(g.texture).__webglTexture,p.get(g.depthTexture).__webglTexture);else if(g.depthBuffer){const ye=g.depthTexture;if(se.__boundDepthTexture!==ye){if(ye!==null&&p.has(ye)&&(g.width!==ye.image.width||g.height!==ye.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");L.setupDepthRenderbuffer(g)}}const _e=g.texture;(_e.isData3DTexture||_e.isDataArrayTexture||_e.isCompressedArrayTexture)&&(oe=!0);const Se=p.get(g).__webglFramebuffer;g.isWebGLCubeRenderTarget?(Array.isArray(Se[y])?N=Se[y][B]:N=Se[y],U=!0):g.samples>0&&L.useMultisampledRTT(g)===!1?N=p.get(g).__webglMultisampledFramebuffer:Array.isArray(Se)?N=Se[B]:N=Se,F.copy(g.viewport),O.copy(g.scissor),ne=g.scissorTest}else F.copy(W).multiplyScalar(Le).floor(),O.copy(Z).multiplyScalar(Le).floor(),ne=te;if(B!==0&&(N=wo),ge.bindFramebuffer(b.FRAMEBUFFER,N)&&ge.drawBuffers(g,N),ge.viewport(F),ge.scissor(O),ge.setScissorTest(ne),U){const se=p.get(g.texture);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_CUBE_MAP_POSITIVE_X+y,se.__webglTexture,B)}else if(oe){const se=y;for(let _e=0;_e<g.textures.length;_e++){const Se=p.get(g.textures[_e]);b.framebufferTextureLayer(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0+_e,Se.__webglTexture,B,se)}}else if(g!==null&&B!==0){const se=p.get(g.texture);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,se.__webglTexture,B)}z=-1},this.readRenderTargetPixels=function(g,y,B,N,U,oe,le,se=0){if(!(g&&g.isWebGLRenderTarget)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let _e=p.get(g).__webglFramebuffer;if(g.isWebGLCubeRenderTarget&&le!==void 0&&(_e=_e[le]),_e){ge.bindFramebuffer(b.FRAMEBUFFER,_e);try{const Se=g.textures[se],ye=Se.format,Fe=Se.type;if(g.textures.length>1&&b.readBuffer(b.COLOR_ATTACHMENT0+se),!Je.textureFormatReadable(ye)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Je.textureTypeReadable(Fe)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}y>=0&&y<=g.width-N&&B>=0&&B<=g.height-U&&b.readPixels(y,B,N,U,re.convert(ye),re.convert(Fe),oe)}finally{const Se=k!==null?p.get(k).__webglFramebuffer:null;ge.bindFramebuffer(b.FRAMEBUFFER,Se)}}},this.readRenderTargetPixelsAsync=async function(g,y,B,N,U,oe,le,se=0){if(!(g&&g.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let _e=p.get(g).__webglFramebuffer;if(g.isWebGLCubeRenderTarget&&le!==void 0&&(_e=_e[le]),_e)if(y>=0&&y<=g.width-N&&B>=0&&B<=g.height-U){ge.bindFramebuffer(b.FRAMEBUFFER,_e);const Se=g.textures[se],ye=Se.format,Fe=Se.type;if(g.textures.length>1&&b.readBuffer(b.COLOR_ATTACHMENT0+se),!Je.textureFormatReadable(ye))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Je.textureTypeReadable(Fe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ee=b.createBuffer();b.bindBuffer(b.PIXEL_PACK_BUFFER,Ee),b.bufferData(b.PIXEL_PACK_BUFFER,oe.byteLength,b.STREAM_READ),b.readPixels(y,B,N,U,re.convert(ye),re.convert(Fe),0);const Ye=k!==null?p.get(k).__webglFramebuffer:null;ge.bindFramebuffer(b.FRAMEBUFFER,Ye);const ct=b.fenceSync(b.SYNC_GPU_COMMANDS_COMPLETE,0);return b.flush(),await Uo(b,ct,4),b.bindBuffer(b.PIXEL_PACK_BUFFER,Ee),b.getBufferSubData(b.PIXEL_PACK_BUFFER,0,oe),b.deleteBuffer(Ee),b.deleteSync(ct),oe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(g,y=null,B=0){const N=Math.pow(2,-B),U=Math.floor(g.image.width*N),oe=Math.floor(g.image.height*N),le=y!==null?y.x:0,se=y!==null?y.y:0;L.setTexture2D(g,0),b.copyTexSubImage2D(b.TEXTURE_2D,B,0,0,le,se,U,oe),ge.unbindTexture()};const Lo=b.createFramebuffer(),yo=b.createFramebuffer();this.copyTextureToTexture=function(g,y,B=null,N=null,U=0,oe=0){let le,se,_e,Se,ye,Fe,Ee,Ye,ct;const at=g.isCompressedTexture?g.mipmaps[oe]:g.image;if(B!==null)le=B.max.x-B.min.x,se=B.max.y-B.min.y,_e=B.isBox3?B.max.z-B.min.z:1,Se=B.min.x,ye=B.min.y,Fe=B.isBox3?B.min.z:0;else{const gt=Math.pow(2,-U);le=Math.floor(at.width*gt),se=Math.floor(at.height*gt),g.isDataArrayTexture?_e=at.depth:g.isData3DTexture?_e=Math.floor(at.depth*gt):_e=1,Se=0,ye=0,Fe=0}N!==null?(Ee=N.x,Ye=N.y,ct=N.z):(Ee=0,Ye=0,ct=0);const je=re.convert(y.format),St=re.convert(y.type);let ve;y.isData3DTexture?(L.setTexture3D(y,0),ve=b.TEXTURE_3D):y.isDataArrayTexture||y.isCompressedArrayTexture?(L.setTexture2DArray(y,0),ve=b.TEXTURE_2D_ARRAY):(L.setTexture2D(y,0),ve=b.TEXTURE_2D),b.pixelStorei(b.UNPACK_FLIP_Y_WEBGL,y.flipY),b.pixelStorei(b.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),b.pixelStorei(b.UNPACK_ALIGNMENT,y.unpackAlignment);const At=b.getParameter(b.UNPACK_ROW_LENGTH),Ve=b.getParameter(b.UNPACK_IMAGE_HEIGHT),wt=b.getParameter(b.UNPACK_SKIP_PIXELS),Dt=b.getParameter(b.UNPACK_SKIP_ROWS),cn=b.getParameter(b.UNPACK_SKIP_IMAGES);b.pixelStorei(b.UNPACK_ROW_LENGTH,at.width),b.pixelStorei(b.UNPACK_IMAGE_HEIGHT,at.height),b.pixelStorei(b.UNPACK_SKIP_PIXELS,Se),b.pixelStorei(b.UNPACK_SKIP_ROWS,ye),b.pixelStorei(b.UNPACK_SKIP_IMAGES,Fe);const mn=g.isDataArrayTexture||g.isData3DTexture,Ze=y.isDataArrayTexture||y.isData3DTexture;if(g.isDepthTexture){const gt=p.get(g),$t=p.get(y),_t=p.get(gt.__renderTarget),Zt=p.get($t.__renderTarget);ge.bindFramebuffer(b.READ_FRAMEBUFFER,_t.__webglFramebuffer),ge.bindFramebuffer(b.DRAW_FRAMEBUFFER,Zt.__webglFramebuffer);for(let _n=0;_n<_e;_n++)mn&&(b.framebufferTextureLayer(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,p.get(g).__webglTexture,U,Fe+_n),b.framebufferTextureLayer(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,p.get(y).__webglTexture,oe,ct+_n)),b.blitFramebuffer(Se,ye,le,se,Ee,Ye,le,se,b.DEPTH_BUFFER_BIT,b.NEAREST);ge.bindFramebuffer(b.READ_FRAMEBUFFER,null),ge.bindFramebuffer(b.DRAW_FRAMEBUFFER,null)}else if(U!==0||g.isRenderTargetTexture||p.has(g)){const gt=p.get(g),$t=p.get(y);ge.bindFramebuffer(b.READ_FRAMEBUFFER,Lo),ge.bindFramebuffer(b.DRAW_FRAMEBUFFER,yo);for(let _t=0;_t<_e;_t++)mn?b.framebufferTextureLayer(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,gt.__webglTexture,U,Fe+_t):b.framebufferTexture2D(b.READ_FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,gt.__webglTexture,U),Ze?b.framebufferTextureLayer(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,$t.__webglTexture,oe,ct+_t):b.framebufferTexture2D(b.DRAW_FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,$t.__webglTexture,oe),U!==0?b.blitFramebuffer(Se,ye,le,se,Ee,Ye,le,se,b.COLOR_BUFFER_BIT,b.NEAREST):Ze?b.copyTexSubImage3D(ve,oe,Ee,Ye,ct+_t,Se,ye,le,se):b.copyTexSubImage2D(ve,oe,Ee,Ye,Se,ye,le,se);ge.bindFramebuffer(b.READ_FRAMEBUFFER,null),ge.bindFramebuffer(b.DRAW_FRAMEBUFFER,null)}else Ze?g.isDataTexture||g.isData3DTexture?b.texSubImage3D(ve,oe,Ee,Ye,ct,le,se,_e,je,St,at.data):y.isCompressedArrayTexture?b.compressedTexSubImage3D(ve,oe,Ee,Ye,ct,le,se,_e,je,at.data):b.texSubImage3D(ve,oe,Ee,Ye,ct,le,se,_e,je,St,at):g.isDataTexture?b.texSubImage2D(b.TEXTURE_2D,oe,Ee,Ye,le,se,je,St,at.data):g.isCompressedTexture?b.compressedTexSubImage2D(b.TEXTURE_2D,oe,Ee,Ye,at.width,at.height,je,at.data):b.texSubImage2D(b.TEXTURE_2D,oe,Ee,Ye,le,se,je,St,at);b.pixelStorei(b.UNPACK_ROW_LENGTH,At),b.pixelStorei(b.UNPACK_IMAGE_HEIGHT,Ve),b.pixelStorei(b.UNPACK_SKIP_PIXELS,wt),b.pixelStorei(b.UNPACK_SKIP_ROWS,Dt),b.pixelStorei(b.UNPACK_SKIP_IMAGES,cn),oe===0&&y.generateMipmaps&&b.generateMipmap(ve),ge.unbindTexture()},this.initRenderTarget=function(g){p.get(g).__webglFramebuffer===void 0&&L.setupRenderTarget(g)},this.initTexture=function(g){g.isCubeTexture?L.setTextureCube(g,0):g.isData3DTexture?L.setTexture3D(g,0):g.isDataArrayTexture||g.isCompressedArrayTexture?L.setTexture2DArray(g,0):L.setTexture2D(g,0),ge.unbindTexture()},this.resetState=function(){C=0,G=0,k=null,ge.reset(),J.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return sr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=ze._getDrawingBufferColorSpace(t),e.unpackColorSpace=ze._getUnpackColorSpace()}}function _a(n,t){if(t===Xs)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),n;if(t===Fi||t===Ya){let e=n.getIndex();if(e===null){const o=[],s=n.getAttribute("position");if(s!==void 0){for(let c=0;c<s.count;c++)o.push(c);n.setIndex(o),e=n.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),n}const i=e.count-2,r=[];if(t===Fi)for(let o=1;o<=i;o++)r.push(e.getX(0)),r.push(e.getX(o)),r.push(e.getX(o+1));else for(let o=0;o<i;o++)o%2===0?(r.push(e.getX(o)),r.push(e.getX(o+1)),r.push(e.getX(o+2))):(r.push(e.getX(o+2)),r.push(e.getX(o+1)),r.push(e.getX(o)));r.length/3!==i&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const a=n.clone();return a.setIndex(r),a.clearGroups(),a}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),n}function np(n){const t=new Map,e=new Map,i=n.clone();return uo(n,i,function(r,a){t.set(a,r),e.set(r,a)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;const a=r,o=t.get(r),s=o.skeleton.bones;a.skeleton=o.skeleton.clone(),a.bindMatrix.copy(o.bindMatrix),a.skeleton.bones=s.map(function(c){return e.get(c)}),a.bind(a.skeleton,a.bindMatrix)}),i}function uo(n,t,e){e(n,t);for(let i=0;i<n.children.length;i++)uo(n.children[i],t.children[i],e)}class Sh extends ci{constructor(t){super(t),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(e){return new sp(e)}),this.register(function(e){return new cp(e)}),this.register(function(e){return new gp(e)}),this.register(function(e){return new vp(e)}),this.register(function(e){return new Sp(e)}),this.register(function(e){return new fp(e)}),this.register(function(e){return new up(e)}),this.register(function(e){return new dp(e)}),this.register(function(e){return new pp(e)}),this.register(function(e){return new op(e)}),this.register(function(e){return new hp(e)}),this.register(function(e){return new lp(e)}),this.register(function(e){return new _p(e)}),this.register(function(e){return new mp(e)}),this.register(function(e){return new rp(e)}),this.register(function(e){return new ga(e,Be.EXT_MESHOPT_COMPRESSION)}),this.register(function(e){return new ga(e,Be.KHR_MESHOPT_COMPRESSION)}),this.register(function(e){return new Ep(e)})}load(t,e,i,r){const a=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const l=Rn.extractUrlBase(t);o=Rn.resolveURL(l,this.path)}else o=Rn.extractUrlBase(t);this.manager.itemStart(t);const s=function(l){r?r(l):console.error(l),a.manager.itemError(t),a.manager.itemEnd(t)},c=new $i(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(t,function(l){try{a.parse(l,o,function(d){e(d),a.manager.itemEnd(t)},s)}catch(d){s(d)}},i,s)}setDRACOLoader(t){return this.dracoLoader=t,this}setKTX2Loader(t){return this.ktx2Loader=t,this}setMeshoptDecoder(t){return this.meshoptDecoder=t,this}register(t){return this.pluginCallbacks.indexOf(t)===-1&&this.pluginCallbacks.push(t),this}unregister(t){return this.pluginCallbacks.indexOf(t)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(t),1),this}parse(t,e,i,r){let a;const o={},s={},c=new TextDecoder;if(typeof t=="string")a=JSON.parse(t);else if(t instanceof ArrayBuffer)if(c.decode(new Uint8Array(t,0,4))===po){try{o[Be.KHR_BINARY_GLTF]=new xp(t)}catch(u){r&&r(u);return}a=JSON.parse(o[Be.KHR_BINARY_GLTF].content)}else a=JSON.parse(c.decode(t));else a=t;if(a.asset===void 0||a.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const l=new Up(a,{path:e||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let d=0;d<this.pluginCallbacks.length;d++){const u=this.pluginCallbacks[d](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),s[u.name]=u,o[u.name]=!0}if(a.extensionsUsed)for(let d=0;d<a.extensionsUsed.length;++d){const u=a.extensionsUsed[d],f=a.extensionsRequired||[];switch(u){case Be.KHR_MATERIALS_UNLIT:o[u]=new ap;break;case Be.KHR_DRACO_MESH_COMPRESSION:o[u]=new Tp(a,this.dracoLoader);break;case Be.KHR_TEXTURE_TRANSFORM:o[u]=new Mp;break;case Be.KHR_MESH_QUANTIZATION:o[u]=new Ap;break;default:f.indexOf(u)>=0&&s[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(o),l.setPlugins(s),l.parse(i,r)}parseAsync(t,e){const i=this;return new Promise(function(r,a){i.parse(t,e,r,a)})}}function ip(){let n={};return{get:function(t){return n[t]},add:function(t,e){n[t]=e},remove:function(t){delete n[t]},removeAll:function(){n={}}}}function ft(n,t,e){const i=n.json.materials[t];return i.extensions&&i.extensions[e]?i.extensions[e]:null}const Be={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class rp{constructor(t){this.parser=t,this.name=Be.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const t=this.parser,e=this.parser.json.nodes||[];for(let i=0,r=e.length;i<r;i++){const a=e[i];a.extensions&&a.extensions[this.name]&&a.extensions[this.name].light!==void 0&&t._addNodeRef(this.cache,a.extensions[this.name].light)}}_loadLight(t){const e=this.parser,i="light:"+t;let r=e.cache.get(i);if(r)return r;const a=e.json,c=((a.extensions&&a.extensions[this.name]||{}).lights||[])[t];let l;const d=new De(16777215);c.color!==void 0&&d.setRGB(c.color[0],c.color[1],c.color[2],bt);const u=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new $a(d),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new Oi(d),l.distance=u;break;case"spot":l=new ja(d),l.distance=u,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),Ft(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=e.createUniqueName(c.name||"light_"+t),r=Promise.resolve(l),e.cache.add(i,r),r}getDependency(t,e){if(t==="light")return this._loadLight(e)}createNodeAttachment(t){const e=this,i=this.parser,a=i.json.nodes[t],s=(a.extensions&&a.extensions[this.name]||{}).light;return s===void 0?null:this._loadLight(s).then(function(c){return i._getNodeRef(e.cache,s,c)})}}class ap{constructor(){this.name=Be.KHR_MATERIALS_UNLIT}getMaterialType(){return xn}extendParams(t,e,i){const r=[];t.color=new De(1,1,1),t.opacity=1;const a=e.pbrMetallicRoughness;if(a){if(Array.isArray(a.baseColorFactor)){const o=a.baseColorFactor;t.color.setRGB(o[0],o[1],o[2],bt),t.opacity=o[3]}a.baseColorTexture!==void 0&&r.push(i.assignTexture(t,"map",a.baseColorTexture,dt))}return Promise.all(r)}}class op{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);return i===null||i.emissiveStrength!==void 0&&(e.emissiveIntensity=i.emissiveStrength),Promise.resolve()}}class sp{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_CLEARCOAT}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];if(i.clearcoatFactor!==void 0&&(e.clearcoat=i.clearcoatFactor),i.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(e,"clearcoatMap",i.clearcoatTexture)),i.clearcoatRoughnessFactor!==void 0&&(e.clearcoatRoughness=i.clearcoatRoughnessFactor),i.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(e,"clearcoatRoughnessMap",i.clearcoatRoughnessTexture)),i.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(e,"clearcoatNormalMap",i.clearcoatNormalTexture)),i.clearcoatNormalTexture.scale!==void 0)){const a=i.clearcoatNormalTexture.scale;e.clearcoatNormalScale=new vt(a,a)}return Promise.all(r)}}class cp{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_DISPERSION}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);return i===null||(e.dispersion=i.dispersion!==void 0?i.dispersion:0),Promise.resolve()}}class lp{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_IRIDESCENCE}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];return i.iridescenceFactor!==void 0&&(e.iridescence=i.iridescenceFactor),i.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(e,"iridescenceMap",i.iridescenceTexture)),i.iridescenceIor!==void 0&&(e.iridescenceIOR=i.iridescenceIor),e.iridescenceThicknessRange===void 0&&(e.iridescenceThicknessRange=[100,400]),i.iridescenceThicknessMinimum!==void 0&&(e.iridescenceThicknessRange[0]=i.iridescenceThicknessMinimum),i.iridescenceThicknessMaximum!==void 0&&(e.iridescenceThicknessRange[1]=i.iridescenceThicknessMaximum),i.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(e,"iridescenceThicknessMap",i.iridescenceThicknessTexture)),Promise.all(r)}}class fp{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_SHEEN}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];if(e.sheenColor=new De(0,0,0),e.sheenRoughness=0,e.sheen=1,i.sheenColorFactor!==void 0){const a=i.sheenColorFactor;e.sheenColor.setRGB(a[0],a[1],a[2],bt)}return i.sheenRoughnessFactor!==void 0&&(e.sheenRoughness=i.sheenRoughnessFactor),i.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(e,"sheenColorMap",i.sheenColorTexture,dt)),i.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(e,"sheenRoughnessMap",i.sheenRoughnessTexture)),Promise.all(r)}}class up{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_TRANSMISSION}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];return i.transmissionFactor!==void 0&&(e.transmission=i.transmissionFactor),i.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(e,"transmissionMap",i.transmissionTexture)),Promise.all(r)}}class dp{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_VOLUME}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];e.thickness=i.thicknessFactor!==void 0?i.thicknessFactor:0,i.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(e,"thicknessMap",i.thicknessTexture)),e.attenuationDistance=i.attenuationDistance||1/0;const a=i.attenuationColor||[1,1,1];return e.attenuationColor=new De().setRGB(a[0],a[1],a[2],bt),Promise.all(r)}}class pp{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_IOR}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);return i===null||(e.ior=i.ior!==void 0?i.ior:1.5),Promise.resolve()}}class hp{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_SPECULAR}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];e.specularIntensity=i.specularFactor!==void 0?i.specularFactor:1,i.specularTexture!==void 0&&r.push(this.parser.assignTexture(e,"specularIntensityMap",i.specularTexture));const a=i.specularColorFactor||[1,1,1];return e.specularColor=new De().setRGB(a[0],a[1],a[2],bt),i.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(e,"specularColorMap",i.specularColorTexture,dt)),Promise.all(r)}}class mp{constructor(t){this.parser=t,this.name=Be.EXT_MATERIALS_BUMP}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];return e.bumpScale=i.bumpFactor!==void 0?i.bumpFactor:1,i.bumpTexture!==void 0&&r.push(this.parser.assignTexture(e,"bumpMap",i.bumpTexture)),Promise.all(r)}}class _p{constructor(t){this.parser=t,this.name=Be.KHR_MATERIALS_ANISOTROPY}getMaterialType(t){return ft(this.parser,t,this.name)!==null?kt:null}extendMaterialParams(t,e){const i=ft(this.parser,t,this.name);if(i===null)return Promise.resolve();const r=[];return i.anisotropyStrength!==void 0&&(e.anisotropy=i.anisotropyStrength),i.anisotropyRotation!==void 0&&(e.anisotropyRotation=i.anisotropyRotation),i.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(e,"anisotropyMap",i.anisotropyTexture)),Promise.all(r)}}class gp{constructor(t){this.parser=t,this.name=Be.KHR_TEXTURE_BASISU}loadTexture(t){const e=this.parser,i=e.json,r=i.textures[t];if(!r.extensions||!r.extensions[this.name])return null;const a=r.extensions[this.name],o=e.options.ktx2Loader;if(!o){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return e.loadTextureImage(t,a.source,o)}}class vp{constructor(t){this.parser=t,this.name=Be.EXT_TEXTURE_WEBP}loadTexture(t){const e=this.name,i=this.parser,r=i.json,a=r.textures[t];if(!a.extensions||!a.extensions[e])return null;const o=a.extensions[e],s=r.images[o.source];let c=i.textureLoader;if(s.uri){const l=i.options.manager.getHandler(s.uri);l!==null&&(c=l)}return i.loadTextureImage(t,o.source,c)}}class Sp{constructor(t){this.parser=t,this.name=Be.EXT_TEXTURE_AVIF}loadTexture(t){const e=this.name,i=this.parser,r=i.json,a=r.textures[t];if(!a.extensions||!a.extensions[e])return null;const o=a.extensions[e],s=r.images[o.source];let c=i.textureLoader;if(s.uri){const l=i.options.manager.getHandler(s.uri);l!==null&&(c=l)}return i.loadTextureImage(t,o.source,c)}}class ga{constructor(t,e){this.name=e,this.parser=t}loadBufferView(t){const e=this.parser.json,i=e.bufferViews[t];if(i.extensions&&i.extensions[this.name]){const r=i.extensions[this.name],a=this.parser.getDependency("buffer",r.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(e.extensionsRequired&&e.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return a.then(function(s){const c=r.byteOffset||0,l=r.byteLength||0,d=r.count,u=r.byteStride,f=new Uint8Array(s,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(d,u,f,r.mode,r.filter).then(function(_){return _.buffer}):o.ready.then(function(){const _=new ArrayBuffer(d*u);return o.decodeGltfBuffer(new Uint8Array(_),d,u,f,r.mode,r.filter),_})})}else return null}}class Ep{constructor(t){this.name=Be.EXT_MESH_GPU_INSTANCING,this.parser=t}createNodeMesh(t){const e=this.parser.json,i=e.nodes[t];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;const r=e.meshes[i.mesh];for(const l of r.primitives)if(l.mode!==Ct.TRIANGLES&&l.mode!==Ct.TRIANGLE_STRIP&&l.mode!==Ct.TRIANGLE_FAN&&l.mode!==void 0)return null;const o=i.extensions[this.name].attributes,s=[],c={};for(const l in o)s.push(this.parser.getDependency("accessor",o[l]).then(d=>(c[l]=d,c[l])));return s.length<1?null:(s.push(this.parser.createNodeMesh(t)),Promise.all(s).then(l=>{const d=l.pop(),u=d.isGroup?d.children:[d],f=l[0].count,_=[];for(const S of u){const R=new ke,m=new Re,h=new Nt,T=new Re(1,1,1),M=new Ks(S.geometry,S.material,f);for(let A=0;A<f;A++)c.TRANSLATION&&m.fromBufferAttribute(c.TRANSLATION,A),c.ROTATION&&h.fromBufferAttribute(c.ROTATION,A),c.SCALE&&T.fromBufferAttribute(c.SCALE,A),M.setMatrixAt(A,R.compose(m,h,T));for(const A in c)if(A==="_COLOR_0"){const I=c[A];M.instanceColor=new qs(I.array,I.itemSize,I.normalized)}else A!=="TRANSLATION"&&A!=="ROTATION"&&A!=="SCALE"&&S.geometry.setAttribute(A,c[A]);Tn.prototype.copy.call(M,S),this.parser.assignFinalMaterial(M),_.push(M)}return d.isGroup?(d.clear(),d.add(..._),d):_[0]}))}}const po="glTF",Fn=12,va={JSON:1313821514,BIN:5130562};class xp{constructor(t){this.name=Be.KHR_BINARY_GLTF,this.content=null,this.body=null;const e=new DataView(t,0,Fn),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(t.slice(0,4))),version:e.getUint32(4,!0),length:e.getUint32(8,!0)},this.header.magic!==po)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const r=this.header.length-Fn,a=new DataView(t,Fn);let o=0;for(;o<r;){const s=a.getUint32(o,!0);o+=4;const c=a.getUint32(o,!0);if(o+=4,c===va.JSON){const l=new Uint8Array(t,Fn+o,s);this.content=i.decode(l)}else if(c===va.BIN){const l=Fn+o;this.body=t.slice(l,l+s)}o+=s}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class Tp{constructor(t,e){if(!e)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Be.KHR_DRACO_MESH_COMPRESSION,this.json=t,this.dracoLoader=e,this.dracoLoader.preload()}decodePrimitive(t,e){const i=this.json,r=this.dracoLoader,a=t.extensions[this.name].bufferView,o=t.extensions[this.name].attributes,s={},c={},l={};for(const d in o){const u=zi[d]||d.toLowerCase();s[u]=o[d]}for(const d in t.attributes){const u=zi[d]||d.toLowerCase();if(o[d]!==void 0){const f=i.accessors[t.attributes[d]],_=bn[f.componentType];l[u]=_.name,c[u]=f.normalized===!0}}return e.getDependency("bufferView",a).then(function(d){return new Promise(function(u,f){r.decodeDracoFile(d,function(_){for(const S in _.attributes){const R=_.attributes[S],m=c[S];m!==void 0&&(R.normalized=m)}u(_)},s,l,bt,f)})})}}class Mp{constructor(){this.name=Be.KHR_TEXTURE_TRANSFORM}extendTexture(t,e){return(e.texCoord===void 0||e.texCoord===t.channel)&&e.offset===void 0&&e.rotation===void 0&&e.scale===void 0||(t=t.clone(),e.texCoord!==void 0&&(t.channel=e.texCoord),e.offset!==void 0&&t.offset.fromArray(e.offset),e.rotation!==void 0&&(t.rotation=e.rotation),e.scale!==void 0&&t.repeat.fromArray(e.scale),t.needsUpdate=!0),t}}class Ap{constructor(){this.name=Be.KHR_MESH_QUANTIZATION}}class ho extends nc{constructor(t,e,i,r){super(t,e,i,r)}copySampleValue_(t){const e=this.resultBuffer,i=this.sampleValues,r=this.valueSize,a=t*r*3+r;for(let o=0;o!==r;o++)e[o]=i[a+o];return e}interpolate_(t,e,i,r){const a=this.resultBuffer,o=this.sampleValues,s=this.valueSize,c=s*2,l=s*3,d=r-e,u=(i-e)/d,f=u*u,_=f*u,S=t*l,R=S-l,m=-2*_+3*f,h=_-f,T=1-m,M=h-f+u;for(let A=0;A!==s;A++){const I=o[R+A+s],P=o[R+A+c]*d,D=o[S+A+s],v=o[S+A]*d;a[A]=T*I+M*P+m*D+h*v}return a}}const Rp=new Nt;class bp extends ho{interpolate_(t,e,i,r){const a=super.interpolate_(t,e,i,r);return Rp.fromArray(a).normalize().toArray(a),a}}const Ct={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},bn={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Sa={9728:qt,9729:xt,9984:Ca,9985:ei,9986:On,9987:tn},Ea={33071:wn,33648:ba,10497:Ln},Pi={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},zi={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Qt={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Cp={CUBICSPLINE:void 0,LINEAR:ro,STEP:ec},wi={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Pp(n){return n.DefaultMaterial===void 0&&(n.DefaultMaterial=new Ja({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Cn})),n.DefaultMaterial}function un(n,t,e){for(const i in e.extensions)n[i]===void 0&&(t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[i]=e.extensions[i])}function Ft(n,t){t.extras!==void 0&&(typeof t.extras=="object"?Object.assign(n.userData,t.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras))}function wp(n,t,e){let i=!1,r=!1,a=!1;for(let l=0,d=t.length;l<d;l++){const u=t[l];if(u.POSITION!==void 0&&(i=!0),u.NORMAL!==void 0&&(r=!0),u.COLOR_0!==void 0&&(a=!0),i&&r&&a)break}if(!i&&!r&&!a)return Promise.resolve(n);const o=[],s=[],c=[];for(let l=0,d=t.length;l<d;l++){const u=t[l];if(i){const f=u.POSITION!==void 0?e.getDependency("accessor",u.POSITION):n.attributes.position;o.push(f)}if(r){const f=u.NORMAL!==void 0?e.getDependency("accessor",u.NORMAL):n.attributes.normal;s.push(f)}if(a){const f=u.COLOR_0!==void 0?e.getDependency("accessor",u.COLOR_0):n.attributes.color;c.push(f)}}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(c)]).then(function(l){const d=l[0],u=l[1],f=l[2];return i&&(n.morphAttributes.position=d),r&&(n.morphAttributes.normal=u),a&&(n.morphAttributes.color=f),n.morphTargetsRelative=!0,n})}function Lp(n,t){if(n.updateMorphTargets(),t.weights!==void 0)for(let e=0,i=t.weights.length;e<i;e++)n.morphTargetInfluences[e]=t.weights[e];if(t.extras&&Array.isArray(t.extras.targetNames)){const e=t.extras.targetNames;if(n.morphTargetInfluences.length===e.length){n.morphTargetDictionary={};for(let i=0,r=e.length;i<r;i++)n.morphTargetDictionary[e[i]]=i}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function yp(n){let t;const e=n.extensions&&n.extensions[Be.KHR_DRACO_MESH_COMPRESSION];if(e?t="draco:"+e.bufferView+":"+e.indices+":"+Li(e.attributes):t=n.indices+":"+Li(n.attributes)+":"+n.mode,n.targets!==void 0)for(let i=0,r=n.targets.length;i<r;i++)t+=":"+Li(n.targets[i]);return t}function Li(n){let t="";const e=Object.keys(n).sort();for(let i=0,r=e.length;i<r;i++)t+=e[i]+":"+n[e[i]]+";";return t}function Wi(n){switch(n){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Ip(n){return n.search(/\.jpe?g($|\?)/i)>0||n.search(/^data\:image\/jpeg/)===0?"image/jpeg":n.search(/\.webp($|\?)/i)>0||n.search(/^data\:image\/webp/)===0?"image/webp":n.search(/\.ktx2($|\?)/i)>0||n.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const Dp=new ke;class Up{constructor(t={},e={}){this.json=t,this.extensions={},this.plugins={},this.options=e,this.cache=new ip,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,a=!1,o=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){const s=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(s)===!0;const c=s.match(/Version\/(\d+)/);r=i&&c?parseInt(c[1],10):-1,a=s.indexOf("Firefox")>-1,o=a?s.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||a&&o<98?this.textureLoader=new Za(this.options.manager):this.textureLoader=new Ys(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new $i(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(t){this.extensions=t}setPlugins(t){this.plugins=t}parse(t,e){const i=this,r=this.json,a=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(o){const s={scene:o[0][r.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:r.asset,parser:i,userData:{}};return un(a,s,r),Ft(s,r),Promise.all(i._invokeAll(function(c){return c.afterRoot&&c.afterRoot(s)})).then(function(){for(const c of s.scenes)c.updateMatrixWorld();t(s)})}).catch(e)}_markDefs(){const t=this.json.nodes||[],e=this.json.skins||[],i=this.json.meshes||[];for(let r=0,a=e.length;r<a;r++){const o=e[r].joints;for(let s=0,c=o.length;s<c;s++)t[o[s]].isBone=!0}for(let r=0,a=t.length;r<a;r++){const o=t[r];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(i[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(t,e){e!==void 0&&(t.refs[e]===void 0&&(t.refs[e]=t.uses[e]=0),t.refs[e]++)}_getNodeRef(t,e,i){if(t.refs[e]<=1)return i;const r=i.clone(),a=(o,s)=>{const c=this.associations.get(o);c!=null&&this.associations.set(s,c);for(const[l,d]of o.children.entries())a(d,s.children[l])};return a(i,r),r.name+="_instance_"+t.uses[e]++,r}_invokeOne(t){const e=Object.values(this.plugins);e.push(this);for(let i=0;i<e.length;i++){const r=t(e[i]);if(r)return r}return null}_invokeAll(t){const e=Object.values(this.plugins);e.unshift(this);const i=[];for(let r=0;r<e.length;r++){const a=t(e[r]);a&&i.push(a)}return i}getDependency(t,e){const i=t+":"+e;let r=this.cache.get(i);if(!r){switch(t){case"scene":r=this.loadScene(e);break;case"node":r=this._invokeOne(function(a){return a.loadNode&&a.loadNode(e)});break;case"mesh":r=this._invokeOne(function(a){return a.loadMesh&&a.loadMesh(e)});break;case"accessor":r=this.loadAccessor(e);break;case"bufferView":r=this._invokeOne(function(a){return a.loadBufferView&&a.loadBufferView(e)});break;case"buffer":r=this.loadBuffer(e);break;case"material":r=this._invokeOne(function(a){return a.loadMaterial&&a.loadMaterial(e)});break;case"texture":r=this._invokeOne(function(a){return a.loadTexture&&a.loadTexture(e)});break;case"skin":r=this.loadSkin(e);break;case"animation":r=this._invokeOne(function(a){return a.loadAnimation&&a.loadAnimation(e)});break;case"camera":r=this.loadCamera(e);break;default:if(r=this._invokeOne(function(a){return a!=this&&a.getDependency&&a.getDependency(t,e)}),!r)throw new Error("Unknown type: "+t);break}this.cache.add(i,r)}return r}getDependencies(t){let e=this.cache.get(t);if(!e){const i=this,r=this.json[t+(t==="mesh"?"es":"s")]||[];e=Promise.all(r.map(function(a,o){return i.getDependency(t,o)})),this.cache.add(t,e)}return e}loadBuffer(t){const e=this.json.buffers[t],i=this.fileLoader;if(e.type&&e.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+e.type+" buffer type is not supported.");if(e.uri===void 0&&t===0)return Promise.resolve(this.extensions[Be.KHR_BINARY_GLTF].body);const r=this.options;return new Promise(function(a,o){i.load(Rn.resolveURL(e.uri,r.path),a,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+e.uri+'".'))})})}loadBufferView(t){const e=this.json.bufferViews[t];return this.getDependency("buffer",e.buffer).then(function(i){const r=e.byteLength||0,a=e.byteOffset||0;return i.slice(a,a+r)})}loadAccessor(t){const e=this,i=this.json,r=this.json.accessors[t];if(r.bufferView===void 0&&r.sparse===void 0){const o=Pi[r.type],s=bn[r.componentType],c=r.normalized===!0,l=new s(r.count*o);return Promise.resolve(new pn(l,o,c))}const a=[];return r.bufferView!==void 0?a.push(this.getDependency("bufferView",r.bufferView)):a.push(null),r.sparse!==void 0&&(a.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),a.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(a).then(function(o){const s=o[0],c=Pi[r.type],l=bn[r.componentType],d=l.BYTES_PER_ELEMENT,u=d*c,f=r.byteOffset||0,_=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,S=r.normalized===!0;let R,m;if(_&&_!==u){const h=Math.floor(f/_),T="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+h+":"+r.count;let M=e.cache.get(T);M||(R=new l(s,h*_,r.count*_/d),M=new js(R,_/d),e.cache.add(T,M)),m=new tc(M,c,f%_/d,S)}else s===null?R=new l(r.count*c):R=new l(s,f,r.count*c),m=new pn(R,c,S);if(r.sparse!==void 0){const h=Pi.SCALAR,T=bn[r.sparse.indices.componentType],M=r.sparse.indices.byteOffset||0,A=r.sparse.values.byteOffset||0,I=new T(o[1],M,r.sparse.count*h),P=new l(o[2],A,r.sparse.count*c);s!==null&&(m=new pn(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let D=0,v=I.length;D<v;D++){const x=I[D];if(m.setX(x,P[D*c]),c>=2&&m.setY(x,P[D*c+1]),c>=3&&m.setZ(x,P[D*c+2]),c>=4&&m.setW(x,P[D*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=S}return m})}loadTexture(t){const e=this.json,i=this.options,a=e.textures[t].source,o=e.images[a];let s=this.textureLoader;if(o.uri){const c=i.manager.getHandler(o.uri);c!==null&&(s=c)}return this.loadTextureImage(t,a,s)}loadTextureImage(t,e,i){const r=this,a=this.json,o=a.textures[t],s=a.images[e],c=(s.uri||s.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];const l=this.loadImageSource(e,i).then(function(d){d.flipY=!1,d.name=o.name||s.name||"",d.name===""&&typeof s.uri=="string"&&s.uri.startsWith("data:image/")===!1&&(d.name=s.uri);const f=(a.samplers||{})[o.sampler]||{};return d.magFilter=Sa[f.magFilter]||xt,d.minFilter=Sa[f.minFilter]||tn,d.wrapS=Ea[f.wrapS]||Ln,d.wrapT=Ea[f.wrapT]||Ln,d.generateMipmaps=!d.isCompressedTexture&&d.minFilter!==qt&&d.minFilter!==xt,r.associations.set(d,{textures:t}),d}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(t,e){const i=this,r=this.json,a=this.options;if(this.sourceCache[t]!==void 0)return this.sourceCache[t].then(u=>u.clone());const o=r.images[t],s=self.URL||self.webkitURL;let c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=i.getDependency("bufferView",o.bufferView).then(function(u){l=!0;const f=new Blob([u],{type:o.mimeType});return c=s.createObjectURL(f),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+t+" is missing URI and bufferView");const d=Promise.resolve(c).then(function(u){return new Promise(function(f,_){let S=f;e.isImageBitmapLoader===!0&&(S=function(R){const m=new si(R);m.needsUpdate=!0,f(m)}),e.load(Rn.resolveURL(u,a.path),S,void 0,_)})}).then(function(u){return l===!0&&s.revokeObjectURL(c),Ft(u,o),u.userData.mimeType=o.mimeType||Ip(o.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),u});return this.sourceCache[t]=d,d}assignTexture(t,e,i,r){const a=this;return this.getDependency("texture",i.index).then(function(o){if(!o)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(o=o.clone(),o.channel=i.texCoord),a.extensions[Be.KHR_TEXTURE_TRANSFORM]){const s=i.extensions!==void 0?i.extensions[Be.KHR_TEXTURE_TRANSFORM]:void 0;if(s){const c=a.associations.get(o);o=a.extensions[Be.KHR_TEXTURE_TRANSFORM].extendTexture(o,s),a.associations.set(o,c)}}return r!==void 0&&(o.colorSpace=r),t[e]=o,o})}assignFinalMaterial(t){const e=t.geometry;let i=t.material;const r=e.attributes.tangent===void 0,a=e.attributes.color!==void 0,o=e.attributes.normal===void 0;if(t.isPoints){const s="PointsMaterial:"+i.uuid;let c=this.cache.get(s);c||(c=new $s,xi.prototype.copy.call(c,i),c.color.copy(i.color),c.map=i.map,c.sizeAttenuation=!1,this.cache.add(s,c)),i=c}else if(t.isLine){const s="LineBasicMaterial:"+i.uuid;let c=this.cache.get(s);c||(c=new Qa,xi.prototype.copy.call(c,i),c.color.copy(i.color),c.map=i.map,this.cache.add(s,c)),i=c}if(r||a||o){let s="ClonedMaterial:"+i.uuid+":";r&&(s+="derivative-tangents:"),a&&(s+="vertex-colors:"),o&&(s+="flat-shading:");let c=this.cache.get(s);c||(c=i.clone(),a&&(c.vertexColors=!0),o&&(c.flatShading=!0),r&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(s,c),this.associations.set(c,this.associations.get(i))),i=c}t.material=i}getMaterialType(){return Ja}loadMaterial(t){const e=this,i=this.json,r=this.extensions,a=i.materials[t];let o;const s={},c=a.extensions||{},l=[];if(c[Be.KHR_MATERIALS_UNLIT]){const u=r[Be.KHR_MATERIALS_UNLIT];o=u.getMaterialType(),l.push(u.extendParams(s,a,e))}else{const u=a.pbrMetallicRoughness||{};if(s.color=new De(1,1,1),s.opacity=1,Array.isArray(u.baseColorFactor)){const f=u.baseColorFactor;s.color.setRGB(f[0],f[1],f[2],bt),s.opacity=f[3]}u.baseColorTexture!==void 0&&l.push(e.assignTexture(s,"map",u.baseColorTexture,dt)),s.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,s.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(e.assignTexture(s,"metalnessMap",u.metallicRoughnessTexture)),l.push(e.assignTexture(s,"roughnessMap",u.metallicRoughnessTexture))),o=this._invokeOne(function(f){return f.getMaterialType&&f.getMaterialType(t)}),l.push(Promise.all(this._invokeAll(function(f){return f.extendMaterialParams&&f.extendMaterialParams(t,s)})))}a.doubleSided===!0&&(s.side=Gt);const d=a.alphaMode||wi.OPAQUE;if(d===wi.BLEND?(s.transparent=!0,s.depthWrite=!1):(s.transparent=!1,d===wi.MASK&&(s.alphaTest=a.alphaCutoff!==void 0?a.alphaCutoff:.5)),a.normalTexture!==void 0&&o!==xn&&(l.push(e.assignTexture(s,"normalMap",a.normalTexture)),s.normalScale=new vt(1,1),a.normalTexture.scale!==void 0)){const u=a.normalTexture.scale;s.normalScale.set(u,u)}if(a.occlusionTexture!==void 0&&o!==xn&&(l.push(e.assignTexture(s,"aoMap",a.occlusionTexture)),a.occlusionTexture.strength!==void 0&&(s.aoMapIntensity=a.occlusionTexture.strength)),a.emissiveFactor!==void 0&&o!==xn){const u=a.emissiveFactor;s.emissive=new De().setRGB(u[0],u[1],u[2],bt)}return a.emissiveTexture!==void 0&&o!==xn&&l.push(e.assignTexture(s,"emissiveMap",a.emissiveTexture,dt)),Promise.all(l).then(function(){const u=new o(s);return a.name&&(u.name=a.name),Ft(u,a),e.associations.set(u,{materials:t}),a.extensions&&un(r,u,a),u})}createUniqueName(t){const e=Xn.sanitizeNodeName(t||"");return e in this.nodeNamesUsed?e+"_"+ ++this.nodeNamesUsed[e]:(this.nodeNamesUsed[e]=0,e)}loadGeometries(t){const e=this,i=this.extensions,r=this.primitiveCache;function a(s){return i[Be.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(s,e).then(function(c){return xa(c,s,e)})}const o=[];for(let s=0,c=t.length;s<c;s++){const l=t[s],d=yp(l),u=r[d];if(u)o.push(u.promise);else{let f;l.extensions&&l.extensions[Be.KHR_DRACO_MESH_COMPRESSION]?f=a(l):f=xa(new an,l,e),r[d]={primitive:l,promise:f},o.push(f)}}return Promise.all(o)}loadMesh(t){const e=this,i=this.json,r=this.extensions,a=i.meshes[t],o=a.primitives,s=[];for(let c=0,l=o.length;c<l;c++){const d=o[c].material===void 0?Pp(this.cache):this.getDependency("material",o[c].material);s.push(d)}return s.push(e.loadGeometries(o)),Promise.all(s).then(function(c){const l=c.slice(0,c.length-1),d=c[c.length-1],u=[];for(let _=0,S=d.length;_<S;_++){const R=d[_],m=o[_];let h;const T=l[_];if(m.mode===Ct.TRIANGLES||m.mode===Ct.TRIANGLE_STRIP||m.mode===Ct.TRIANGLE_FAN||m.mode===void 0)h=a.isSkinnedMesh===!0?new eo(R,T):new It(R,T),h.isSkinnedMesh===!0&&h.normalizeSkinWeights(),m.mode===Ct.TRIANGLE_STRIP?h.geometry=_a(h.geometry,Ya):m.mode===Ct.TRIANGLE_FAN&&(h.geometry=_a(h.geometry,Fi));else if(m.mode===Ct.LINES)h=new Zs(R,T);else if(m.mode===Ct.LINE_STRIP)h=new to(R,T);else if(m.mode===Ct.LINE_LOOP)h=new Qs(R,T);else if(m.mode===Ct.POINTS)h=new Js(R,T);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(h.geometry.morphAttributes).length>0&&Lp(h,a),h.name=e.createUniqueName(a.name||"mesh_"+t),Ft(h,a),m.extensions&&un(r,h,m),e.assignFinalMaterial(h),u.push(h)}for(let _=0,S=u.length;_<S;_++)e.associations.set(u[_],{meshes:t,primitives:_});if(u.length===1)return a.extensions&&un(r,u[0],a),u[0];const f=new Hn;a.extensions&&un(r,f,a),e.associations.set(f,{meshes:t});for(let _=0,S=u.length;_<S;_++)f.add(u[_]);return f})}loadCamera(t){let e;const i=this.json.cameras[t],r=i[i.type];if(!r){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return i.type==="perspective"?e=new An(Et.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(e=new Ki(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(e.name=this.createUniqueName(i.name)),Ft(e,i),Promise.resolve(e)}loadSkin(t){const e=this.json.skins[t],i=[];for(let r=0,a=e.joints.length;r<a;r++)i.push(this._loadNodeShallow(e.joints[r]));return e.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",e.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){const a=r.pop(),o=r,s=[],c=[];for(let l=0,d=o.length;l<d;l++){const u=o[l];if(u){s.push(u);const f=new ke;a!==null&&f.fromArray(a.array,l*16),c.push(f)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',e.joints[l])}return new no(s,c)})}loadAnimation(t){const e=this.json,i=this,r=e.animations[t],a=r.name?r.name:"animation_"+t,o=[],s=[],c=[],l=[],d=[];for(let u=0,f=r.channels.length;u<f;u++){const _=r.channels[u],S=r.samplers[_.sampler],R=_.target,m=R.node,h=r.parameters!==void 0?r.parameters[S.input]:S.input,T=r.parameters!==void 0?r.parameters[S.output]:S.output;R.node!==void 0&&(o.push(this.getDependency("node",m)),s.push(this.getDependency("accessor",h)),c.push(this.getDependency("accessor",T)),l.push(S),d.push(R))}return Promise.all([Promise.all(o),Promise.all(s),Promise.all(c),Promise.all(l),Promise.all(d)]).then(function(u){const f=u[0],_=u[1],S=u[2],R=u[3],m=u[4],h=[];for(let M=0,A=f.length;M<A;M++){const I=f[M],P=_[M],D=S[M],v=R[M],x=m[M];if(I===void 0)continue;I.updateMatrix&&I.updateMatrix();const q=i._createAnimationTracks(I,P,D,v,x);if(q)for(let C=0;C<q.length;C++)h.push(q[C])}const T=new io(a,void 0,h);return Ft(T,r),T})}createNodeMesh(t){const e=this.json,i=this,r=e.nodes[t];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(a){const o=i._getNodeRef(i.meshCache,r.mesh,a);return r.weights!==void 0&&o.traverse(function(s){if(s.isMesh)for(let c=0,l=r.weights.length;c<l;c++)s.morphTargetInfluences[c]=r.weights[c]}),o})}loadNode(t){const e=this.json,i=this,r=e.nodes[t],a=i._loadNodeShallow(t),o=[],s=r.children||[];for(let l=0,d=s.length;l<d;l++)o.push(i.getDependency("node",s[l]));const c=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([a,Promise.all(o),c]).then(function(l){const d=l[0],u=l[1],f=l[2];f!==null&&d.traverse(function(_){_.isSkinnedMesh&&_.bind(f,Dp)});for(let _=0,S=u.length;_<S;_++)d.add(u[_]);if(d.userData.pivot!==void 0&&u.length>0){const _=d.userData.pivot,S=u[0];d.pivot=new Re().fromArray(_),d.position.x-=_[0],d.position.y-=_[1],d.position.z-=_[2],S.position.set(0,0,0),delete d.userData.pivot}return d})}_loadNodeShallow(t){const e=this.json,i=this.extensions,r=this;if(this.nodeCache[t]!==void 0)return this.nodeCache[t];const a=e.nodes[t],o=a.name?r.createUniqueName(a.name):"",s=[],c=r._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(t)});return c&&s.push(c),a.camera!==void 0&&s.push(r.getDependency("camera",a.camera).then(function(l){return r._getNodeRef(r.cameraCache,a.camera,l)})),r._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(t)}).forEach(function(l){s.push(l)}),this.nodeCache[t]=Promise.all(s).then(function(l){let d;if(a.isBone===!0?d=new Bi:l.length>1?d=new Hn:l.length===1?d=l[0]:d=new Tn,d!==l[0])for(let u=0,f=l.length;u<f;u++)d.add(l[u]);if(a.name&&(d.userData.name=a.name,d.name=o),Ft(d,a),a.extensions&&un(i,d,a),a.matrix!==void 0){const u=new ke;u.fromArray(a.matrix),d.applyMatrix4(u)}else a.translation!==void 0&&d.position.fromArray(a.translation),a.rotation!==void 0&&d.quaternion.fromArray(a.rotation),a.scale!==void 0&&d.scale.fromArray(a.scale);if(!r.associations.has(d))r.associations.set(d,{});else if(a.mesh!==void 0&&r.meshCache.refs[a.mesh]>1){const u=r.associations.get(d);r.associations.set(d,{...u})}return r.associations.get(d).nodes=t,d}),this.nodeCache[t]}loadScene(t){const e=this.extensions,i=this.json.scenes[t],r=this,a=new Hn;i.name&&(a.name=r.createUniqueName(i.name)),Ft(a,i),i.extensions&&un(e,a,i);const o=i.nodes||[],s=[];for(let c=0,l=o.length;c<l;c++)s.push(r.getDependency("node",o[c]));return Promise.all(s).then(function(c){for(let d=0,u=c.length;d<u;d++){const f=c[d];f.parent!==null?a.add(np(f)):a.add(f)}const l=d=>{const u=new Map;for(const[f,_]of r.associations)(f instanceof xi||f instanceof si)&&u.set(f,_);return d.traverse(f=>{const _=r.associations.get(f);_!=null&&u.set(f,_)}),u};return r.associations=l(a),a})}_createAnimationTracks(t,e,i,r,a){const o=[],s=t.name?t.name:t.uuid,c=[];Qt[a.path]===Qt.weights?t.traverse(function(f){f.morphTargetInfluences&&c.push(f.name?f.name:f.uuid)}):c.push(s);let l;switch(Qt[a.path]){case Qt.weights:l=Hi;break;case Qt.rotation:l=li;break;case Qt.translation:case Qt.scale:l=Gi;break;default:switch(i.itemSize){case 1:l=Hi;break;case 2:case 3:default:l=Gi;break}break}const d=r.interpolation!==void 0?Cp[r.interpolation]:ro,u=this._getArrayFromAccessor(i);for(let f=0,_=c.length;f<_;f++){const S=new l(c[f]+"."+Qt[a.path],e.array,u,d);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(S),o.push(S)}return o}_getArrayFromAccessor(t){let e=t.array;if(t.normalized){const i=Wi(e.constructor),r=new Float32Array(e.length);for(let a=0,o=e.length;a<o;a++)r[a]=e[a]*i;e=r}return e}_createCubicSplineTrackInterpolant(t){t.createInterpolant=function(i){const r=this instanceof li?bp:ho;return new r(this.times,this.values,this.getValueSize()/3,i)},t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Np(n,t,e){const i=t.attributes,r=new ic;if(i.POSITION!==void 0){const s=e.json.accessors[i.POSITION],c=s.min,l=s.max;if(c!==void 0&&l!==void 0){if(r.set(new Re(c[0],c[1],c[2]),new Re(l[0],l[1],l[2])),s.normalized){const d=Wi(bn[s.componentType]);r.min.multiplyScalar(d),r.max.multiplyScalar(d)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const a=t.targets;if(a!==void 0){const s=new Re,c=new Re;for(let l=0,d=a.length;l<d;l++){const u=a[l];if(u.POSITION!==void 0){const f=e.json.accessors[u.POSITION],_=f.min,S=f.max;if(_!==void 0&&S!==void 0){if(c.setX(Math.max(Math.abs(_[0]),Math.abs(S[0]))),c.setY(Math.max(Math.abs(_[1]),Math.abs(S[1]))),c.setZ(Math.max(Math.abs(_[2]),Math.abs(S[2]))),f.normalized){const R=Wi(bn[f.componentType]);c.multiplyScalar(R)}s.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}r.expandByVector(s)}n.boundingBox=r;const o=new rc;r.getCenter(o.center),o.radius=r.min.distanceTo(r.max)/2,n.boundingSphere=o}function xa(n,t,e){const i=t.attributes,r=[];function a(o,s){return e.getDependency("accessor",o).then(function(c){n.setAttribute(s,c)})}for(const o in i){const s=zi[o]||o.toLowerCase();s in n.attributes||r.push(a(i[o],s))}if(t.indices!==void 0&&!n.index){const o=e.getDependency("accessor",t.indices).then(function(s){n.setIndex(s)});r.push(o)}return ze.workingColorSpace!==bt&&"COLOR_0"in i&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${ze.workingColorSpace}" not supported.`),Ft(n,t),Np(n,t,e),Promise.all(r).then(function(){return t.targets!==void 0?wp(n,t.targets,e):n})}/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/var Pt=Uint8Array,Mn=Uint16Array,Fp=Int32Array,mo=new Pt([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),_o=new Pt([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Op=new Pt([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),go=function(n,t){for(var e=new Mn(31),i=0;i<31;++i)e[i]=t+=1<<n[i-1];for(var r=new Fp(e[30]),i=1;i<30;++i)for(var a=e[i];a<e[i+1];++a)r[a]=a-e[i]<<5|i;return{b:e,r}},vo=go(mo,2),So=vo.b,Bp=vo.r;So[28]=258,Bp[258]=28;var Gp=go(_o,0),Hp=Gp.b,Xi=new Mn(32768);for(var rt=0;rt<32768;++rt){var Jt=(rt&43690)>>1|(rt&21845)<<1;Jt=(Jt&52428)>>2|(Jt&13107)<<2,Jt=(Jt&61680)>>4|(Jt&3855)<<4,Xi[rt]=((Jt&65280)>>8|(Jt&255)<<8)>>1}var Vn=(function(n,t,e){for(var i=n.length,r=0,a=new Mn(t);r<i;++r)n[r]&&++a[n[r]-1];var o=new Mn(t);for(r=1;r<t;++r)o[r]=o[r-1]+a[r-1]<<1;var s;if(e){s=new Mn(1<<t);var c=15-t;for(r=0;r<i;++r)if(n[r])for(var l=r<<4|n[r],d=t-n[r],u=o[n[r]-1]++<<d,f=u|(1<<d)-1;u<=f;++u)s[Xi[u]>>c]=l}else for(s=new Mn(i),r=0;r<i;++r)n[r]&&(s[r]=Xi[o[n[r]-1]++]>>15-n[r]);return s}),qn=new Pt(288);for(var rt=0;rt<144;++rt)qn[rt]=8;for(var rt=144;rt<256;++rt)qn[rt]=9;for(var rt=256;rt<280;++rt)qn[rt]=7;for(var rt=280;rt<288;++rt)qn[rt]=8;var Eo=new Pt(32);for(var rt=0;rt<32;++rt)Eo[rt]=5;var Vp=Vn(qn,9,1),kp=Vn(Eo,5,1),yi=function(n){for(var t=n[0],e=1;e<n.length;++e)n[e]>t&&(t=n[e]);return t},Lt=function(n,t,e){var i=t/8|0;return(n[i]|n[i+1]<<8)>>(t&7)&e},Ii=function(n,t){var e=t/8|0;return(n[e]|n[e+1]<<8|n[e+2]<<16)>>(t&7)},zp=function(n){return(n+7)/8|0},Wp=function(n,t,e){return(e==null||e>n.length)&&(e=n.length),new Pt(n.subarray(t,e))},Xp=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],yt=function(n,t,e){var i=new Error(t||Xp[n]);if(i.code=n,Error.captureStackTrace&&Error.captureStackTrace(i,yt),!e)throw i;return i},Kp=function(n,t,e,i){var r=n.length,a=0;if(!r||t.f&&!t.l)return e||new Pt(0);var o=!e,s=o||t.i!=2,c=t.i;o&&(e=new Pt(r*3));var l=function(be){var ot=e.length;if(be>ot){var Ge=new Pt(Math.max(ot*2,be));Ge.set(e),e=Ge}},d=t.f||0,u=t.p||0,f=t.b||0,_=t.l,S=t.d,R=t.m,m=t.n,h=r*8;do{if(!_){d=Lt(n,u,1);var T=Lt(n,u+1,3);if(u+=3,T)if(T==1)_=Vp,S=kp,R=9,m=5;else if(T==2){var P=Lt(n,u,31)+257,D=Lt(n,u+10,15)+4,v=P+Lt(n,u+5,31)+1;u+=14;for(var x=new Pt(v),q=new Pt(19),C=0;C<D;++C)q[Op[C]]=Lt(n,u+C*3,7);u+=D*3;for(var G=yi(q),k=(1<<G)-1,z=Vn(q,G,1),C=0;C<v;){var K=z[Lt(n,u,k)];u+=K&15;var M=K>>4;if(M<16)x[C++]=M;else{var F=0,O=0;for(M==16?(O=3+Lt(n,u,3),u+=2,F=x[C-1]):M==17?(O=3+Lt(n,u,7),u+=3):M==18&&(O=11+Lt(n,u,127),u+=7);O--;)x[C++]=F}}var ne=x.subarray(0,P),ee=x.subarray(P);R=yi(ne),m=yi(ee),_=Vn(ne,R,1),S=Vn(ee,m,1)}else yt(1);else{var M=zp(u)+4,A=n[M-4]|n[M-3]<<8,I=M+A;if(I>r){c&&yt(0);break}s&&l(f+A),e.set(n.subarray(M,I),f),t.b=f+=A,t.p=u=I*8,t.f=d;continue}if(u>h){c&&yt(0);break}}s&&l(f+131072);for(var Te=(1<<R)-1,Ae=(1<<m)-1,ue=u;;ue=u){var F=_[Ii(n,u)&Te],Le=F>>4;if(u+=F&15,u>h){c&&yt(0);break}if(F||yt(2),Le<256)e[f++]=Le;else if(Le==256){ue=u,_=null;break}else{var nt=Le-254;if(Le>264){var C=Le-257,qe=mo[C];nt=Lt(n,u,(1<<qe)-1)+So[C],u+=qe}var W=S[Ii(n,u)&Ae],Z=W>>4;W||yt(3),u+=W&15;var ee=Hp[Z];if(Z>3){var qe=_o[Z];ee+=Ii(n,u)&(1<<qe)-1,u+=qe}if(u>h){c&&yt(0);break}s&&l(f+131072);var te=f+nt;if(f<ee){var Pe=a-ee,Me=Math.min(ee,te);for(Pe+f<0&&yt(3);f<Me;++f)e[f]=i[Pe+f]}for(;f<te;++f)e[f]=e[f-ee]}}t.l=_,t.p=ue,t.b=f,t.f=d,_&&(d=1,t.m=R,t.d=S,t.n=m)}while(!d);return f!=e.length&&o?Wp(e,0,f):e.subarray(0,f)},qp=new Pt(0),Yp=function(n,t){return((n[0]&15)!=8||n[0]>>4>7||(n[0]<<8|n[1])%31)&&yt(6,"invalid zlib data"),(n[1]>>5&1)==1&&yt(6,"invalid zlib data: "+(n[1]&32?"need":"unexpected")+" dictionary"),(n[1]>>3&4)+2};function jp(n,t){return Kp(n.subarray(Yp(n),-4),{i:2},t,t)}var $p=typeof TextDecoder<"u"&&new TextDecoder,Zp=0;try{$p.decode(qp,{stream:!0}),Zp=1}catch{}function xo(n,t,e){const i=e.length-n-1;if(t>=e[i])return i-1;if(t<=e[n])return n;let r=n,a=i,o=Math.floor((r+a)/2);for(;t<e[o]||t>=e[o+1];)t<e[o]?a=o:r=o,o=Math.floor((r+a)/2);return o}function Qp(n,t,e,i){const r=[],a=[],o=[];r[0]=1;for(let s=1;s<=e;++s){a[s]=t-i[n+1-s],o[s]=i[n+s]-t;let c=0;for(let l=0;l<s;++l){const d=o[l+1],u=a[s-l],f=r[l]/(d+u);r[l]=c+d*f,c=u*f}r[s]=c}return r}function Jp(n,t,e,i){const r=xo(n,i,t),a=Qp(r,i,n,t),o=new pt(0,0,0,0);for(let s=0;s<=n;++s){const c=e[r-n+s],l=a[s],d=c.w*l;o.x+=c.x*d,o.y+=c.y*d,o.z+=c.z*d,o.w+=c.w*l}return o}function eh(n,t,e,i,r){const a=[];for(let u=0;u<=e;++u)a[u]=0;const o=[];for(let u=0;u<=i;++u)o[u]=a.slice(0);const s=[];for(let u=0;u<=e;++u)s[u]=a.slice(0);s[0][0]=1;const c=a.slice(0),l=a.slice(0);for(let u=1;u<=e;++u){c[u]=t-r[n+1-u],l[u]=r[n+u]-t;let f=0;for(let _=0;_<u;++_){const S=l[_+1],R=c[u-_];s[u][_]=S+R;const m=s[_][u-1]/s[u][_];s[_][u]=f+S*m,f=R*m}s[u][u]=f}for(let u=0;u<=e;++u)o[0][u]=s[u][e];for(let u=0;u<=e;++u){let f=0,_=1;const S=[];for(let R=0;R<=e;++R)S[R]=a.slice(0);S[0][0]=1;for(let R=1;R<=i;++R){let m=0;const h=u-R,T=e-R;u>=R&&(S[_][0]=S[f][0]/s[T+1][h],m=S[_][0]*s[h][T]);const M=h>=-1?1:-h,A=u-1<=T?R-1:e-u;for(let P=M;P<=A;++P)S[_][P]=(S[f][P]-S[f][P-1])/s[T+1][h+P],m+=S[_][P]*s[h+P][T];u<=T&&(S[_][R]=-S[f][R-1]/s[T+1][u],m+=S[_][R]*s[u][T]),o[R][u]=m;const I=f;f=_,_=I}}let d=e;for(let u=1;u<=i;++u){for(let f=0;f<=e;++f)o[u][f]*=d;d*=e-u}return o}function th(n,t,e,i,r){const a=r<n?r:n,o=[],s=xo(n,i,t),c=eh(s,i,n,a,t),l=[];for(let d=0;d<e.length;++d){const u=e[d].clone(),f=u.w;u.x*=f,u.y*=f,u.z*=f,l[d]=u}for(let d=0;d<=a;++d){const u=l[s-n].clone().multiplyScalar(c[d][0]);for(let f=1;f<=n;++f)u.add(l[s-n+f].clone().multiplyScalar(c[d][f]));o[d]=u}for(let d=a+1;d<=r+1;++d)o[d]=new pt(0,0,0);return o}function nh(n,t){let e=1;for(let r=2;r<=n;++r)e*=r;let i=1;for(let r=2;r<=t;++r)i*=r;for(let r=2;r<=n-t;++r)i*=r;return e/i}function ih(n){const t=n.length,e=[],i=[];for(let a=0;a<t;++a){const o=n[a];e[a]=new Re(o.x,o.y,o.z),i[a]=o.w}const r=[];for(let a=0;a<t;++a){const o=e[a].clone();for(let s=1;s<=a;++s)o.sub(r[a-s].clone().multiplyScalar(nh(a,s)*i[s]));r[a]=o.divideScalar(i[0])}return r}function rh(n,t,e,i,r){const a=th(n,t,e,i,r);return ih(a)}class ah extends ac{constructor(t,e,i,r,a){super();const o=e?e.length-1:0,s=i?i.length:0;this.degree=t,this.knots=e,this.controlPoints=[],this.startKnot=r||0,this.endKnot=a||o;for(let c=0;c<s;++c){const l=i[c];this.controlPoints[c]=new pt(l.x,l.y,l.z,l.w)}}getPoint(t,e=new Re){const i=e,r=this.knots[this.startKnot]+t*(this.knots[this.endKnot]-this.knots[this.startKnot]),a=Jp(this.degree,this.knots,this.controlPoints,r);return a.w!==1&&a.divideScalar(a.w),i.set(a.x,a.y,a.z)}getTangent(t,e=new Re){const i=e,r=this.knots[0]+t*(this.knots[this.knots.length-1]-this.knots[0]),a=rh(this.degree,this.knots,this.controlPoints,r,1);return i.copy(a[1]).normalize(),i}toJSON(){const t=super.toJSON();return t.degree=this.degree,t.knots=[...this.knots],t.controlPoints=this.controlPoints.map(e=>e.toArray()),t.startKnot=this.startKnot,t.endKnot=this.endKnot,t}fromJSON(t){return super.fromJSON(t),this.degree=t.degree,this.knots=[...t.knots],this.controlPoints=t.controlPoints.map(e=>new pt(e[0],e[1],e[2],e[3])),this.startKnot=t.startKnot,this.endKnot=t.endKnot,this}}let Oe,lt,Tt;class Eh extends ci{constructor(t){super(t)}load(t,e,i,r){const a=this,o=a.path===""?Rn.extractUrlBase(t):a.path,s=new $i(this.manager);s.setPath(a.path),s.setResponseType("arraybuffer"),s.setRequestHeader(a.requestHeader),s.setWithCredentials(a.withCredentials),s.load(t,function(c){try{e(a.parse(c,o))}catch(l){r?r(l):console.error(l),a.manager.itemError(t)}},i,r)}parse(t,e){if(uh(t))Oe=new fh().parse(t);else{const r=Ao(t);if(!dh(r))throw new Error("THREE.FBXLoader: Unknown format.");if(Ma(r)<7e3)throw new Error("THREE.FBXLoader: FBX version not supported, FileVersion: "+Ma(r));Oe=new lh().parse(r)}const i=new Za(this.manager).setPath(this.resourcePath||e).setCrossOrigin(this.crossOrigin);return new oh(i,this.manager).parse(Oe)}}class oh{constructor(t,e){this.textureLoader=t,this.manager=e}parse(){lt=this.parseConnections();const t=this.parseImages(),e=this.parseTextures(t),i=this.parseMaterials(e),r=this.parseDeformers(),a=new sh().parse(r);return this.parseScene(r,a,i),Tt}parseConnections(){const t=new Map;return"Connections"in Oe&&Oe.Connections.connections.forEach(function(i){const r=i[0],a=i[1],o=i[2];t.has(r)||t.set(r,{parents:[],children:[]});const s={ID:a,relationship:o};t.get(r).parents.push(s),t.has(a)||t.set(a,{parents:[],children:[]});const c={ID:r,relationship:o};t.get(a).children.push(c)}),t}parseImages(){const t={},e={};if("Video"in Oe.Objects){const i=Oe.Objects.Video;for(const r in i){const a=i[r],o=parseInt(r);if(t[o]=a.RelativeFilename||a.Filename,"Content"in a){const s=a.Content instanceof ArrayBuffer&&a.Content.byteLength>0,c=typeof a.Content=="string"&&a.Content!=="";if(s||c){const l=this.parseImage(i[r]);e[a.RelativeFilename||a.Filename]=l}}}}for(const i in t){const r=t[i];e[r]!==void 0?t[i]=e[r]:t[i]=t[i].split("\\").pop()}return t}parseImage(t){const e=t.Content,i=t.RelativeFilename||t.Filename,r=i.slice(i.lastIndexOf(".")+1).toLowerCase();let a;switch(r){case"bmp":a="image/bmp";break;case"jpg":case"jpeg":a="image/jpeg";break;case"png":a="image/png";break;case"tif":a="image/tiff";break;case"tga":this.manager.getHandler(".tga")===null&&console.warn("FBXLoader: TGA loader not found, skipping ",i),a="image/tga";break;case"webp":a="image/webp";break;default:console.warn('FBXLoader: Image type "'+r+'" is not supported.');return}if(typeof e=="string")return"data:"+a+";base64,"+e;{const o=new Uint8Array(e);return window.URL.createObjectURL(new Blob([o],{type:a}))}}parseTextures(t){const e=new Map;if("Texture"in Oe.Objects){const i=Oe.Objects.Texture;for(const r in i){const a=this.parseTexture(i[r],t);e.set(parseInt(r),a)}}return e}parseTexture(t,e){const i=this.loadTexture(t,e);i.ID=t.id,i.name=t.attrName;const r=t.WrapModeU,a=t.WrapModeV,o=r!==void 0?r.value:0,s=a!==void 0?a.value:0;if(i.wrapS=o===0?Ln:wn,i.wrapT=s===0?Ln:wn,"Scaling"in t){const c=t.Scaling.value;i.repeat.x=c[0],i.repeat.y=c[1]}if("Translation"in t){const c=t.Translation.value;i.offset.x=c[0],i.offset.y=c[1]}return i}loadTexture(t,e){const i=t.FileName.split(".").pop().toLowerCase();let r=this.manager.getHandler(`.${i}`);r===null&&(r=this.textureLoader);const a=r.path;a||r.setPath(this.textureLoader.path);const o=lt.get(t.id).children;let s;if(o!==void 0&&o.length>0&&e[o[0].ID]!==void 0&&(s=e[o[0].ID],(s.indexOf("blob:")===0||s.indexOf("data:")===0)&&r.setPath(void 0)),s===void 0)return console.warn("FBXLoader: Undefined filename, creating placeholder texture."),new si;const c=r.load(s);return r.setPath(a),c}parseMaterials(t){const e=new Map;if("Material"in Oe.Objects){const i=Oe.Objects.Material;for(const r in i){const a=this.parseMaterial(i[r],t);a!==null&&e.set(parseInt(r),a)}}return e}parseMaterial(t,e){const i=t.id,r=t.attrName;let a=t.ShadingModel;if(typeof a=="object"&&(a=a.value),!lt.has(i))return null;const o=this.parseParameters(t,e,i);let s;switch(a.toLowerCase()){case"phong":s=new $n;break;case"lambert":s=new oc;break;default:console.warn('THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.',a),s=new $n;break}return s.setValues(o),s.name=r,s}parseParameters(t,e,i){const r={};t.BumpFactor&&(r.bumpScale=t.BumpFactor.value),t.Diffuse?r.color=ze.colorSpaceToWorking(new De().fromArray(t.Diffuse.value),dt):t.DiffuseColor&&(t.DiffuseColor.type==="Color"||t.DiffuseColor.type==="ColorRGB")&&(r.color=ze.colorSpaceToWorking(new De().fromArray(t.DiffuseColor.value),dt)),t.DisplacementFactor&&(r.displacementScale=t.DisplacementFactor.value),t.Emissive?r.emissive=ze.colorSpaceToWorking(new De().fromArray(t.Emissive.value),dt):t.EmissiveColor&&(t.EmissiveColor.type==="Color"||t.EmissiveColor.type==="ColorRGB")&&(r.emissive=ze.colorSpaceToWorking(new De().fromArray(t.EmissiveColor.value),dt)),t.EmissiveFactor&&(r.emissiveIntensity=parseFloat(t.EmissiveFactor.value)),r.opacity=1-(t.TransparencyFactor?parseFloat(t.TransparencyFactor.value):0),(r.opacity===1||r.opacity===0)&&(r.opacity=t.Opacity?parseFloat(t.Opacity.value):null,r.opacity===null&&(r.opacity=1-(t.TransparentColor?parseFloat(t.TransparentColor.value[0]):0))),r.opacity<1&&(r.transparent=!0),t.ReflectionFactor&&(r.reflectivity=t.ReflectionFactor.value),t.Shininess&&(r.shininess=t.Shininess.value),t.Specular?r.specular=ze.colorSpaceToWorking(new De().fromArray(t.Specular.value),dt):t.SpecularColor&&t.SpecularColor.type==="Color"&&(r.specular=ze.colorSpaceToWorking(new De().fromArray(t.SpecularColor.value),dt));const a=this;return lt.get(i).children.forEach(function(o){const s=o.relationship;switch(s){case"Bump":r.bumpMap=a.getTexture(e,o.ID);break;case"Maya|TEX_ao_map":r.aoMap=a.getTexture(e,o.ID);break;case"DiffuseColor":case"Maya|TEX_color_map":r.map=a.getTexture(e,o.ID),r.map!==void 0&&(r.map.colorSpace=dt);break;case"DisplacementColor":r.displacementMap=a.getTexture(e,o.ID);break;case"EmissiveColor":r.emissiveMap=a.getTexture(e,o.ID),r.emissiveMap!==void 0&&(r.emissiveMap.colorSpace=dt);break;case"NormalMap":case"Maya|TEX_normal_map":r.normalMap=a.getTexture(e,o.ID);break;case"ReflectionColor":r.envMap=a.getTexture(e,o.ID),r.envMap!==void 0&&(r.envMap.mapping=ii,r.envMap.colorSpace=dt);break;case"SpecularColor":r.specularMap=a.getTexture(e,o.ID),r.specularMap!==void 0&&(r.specularMap.colorSpace=dt);break;case"TransparentColor":case"TransparencyFactor":r.alphaMap=a.getTexture(e,o.ID),r.transparent=!0;break;case"AmbientColor":case"ShininessExponent":case"SpecularFactor":case"VectorDisplacementColor":default:console.warn("THREE.FBXLoader: %s map is not supported in three.js, skipping texture.",s);break}}),r}getTexture(t,e){return"LayeredTexture"in Oe.Objects&&e in Oe.Objects.LayeredTexture&&(console.warn("THREE.FBXLoader: layered textures are not supported in three.js. Discarding all but first layer."),e=lt.get(e).children[0].ID),t.get(e)}parseDeformers(){const t={},e={};if("Deformer"in Oe.Objects){const i=Oe.Objects.Deformer;for(const r in i){const a=i[r],o=lt.get(parseInt(r));if(a.attrType==="Skin"){const s=this.parseSkeleton(o,i);s.ID=r,o.parents.length>1&&console.warn("THREE.FBXLoader: skeleton attached to more than one geometry is not supported."),s.geometryID=o.parents[0].ID,t[r]=s}else if(a.attrType==="BlendShape"){const s={id:r};s.rawTargets=this.parseMorphTargets(o,i),s.id=r,o.parents.length>1&&console.warn("THREE.FBXLoader: morph target attached to more than one geometry is not supported."),e[r]=s}}}return{skeletons:t,morphTargets:e}}parseSkeleton(t,e){const i=[];return t.children.forEach(function(r){const a=e[r.ID];if(a.attrType!=="Cluster")return;const o={ID:r.ID,indices:[],weights:[],transformLink:new ke().fromArray(a.TransformLink.a)};"Indexes"in a&&(o.indices=a.Indexes.a,o.weights=a.Weights.a),i.push(o)}),{rawBones:i,bones:[]}}parseMorphTargets(t,e){const i=[];for(let r=0;r<t.children.length;r++){const a=t.children[r],o=e[a.ID],s={name:o.attrName,initialWeight:o.DeformPercent,id:o.id,fullWeights:o.FullWeights.a};if(o.attrType!=="BlendShapeChannel")return;s.geoID=lt.get(parseInt(a.ID)).children.filter(function(c){return c.relationship===void 0})[0].ID,i.push(s)}return i}parseScene(t,e,i){Tt=new Hn;const r=this.parseModels(t.skeletons,e,i),a=Oe.Objects.Model,o=this;r.forEach(function(c){const l=a[c.ID];o.setLookAtProperties(c,l),lt.get(c.ID).parents.forEach(function(u){const f=r.get(u.ID);f!==void 0&&f.add(c)}),c.parent===null&&Tt.add(c)}),this.bindSkeleton(t.skeletons,e,r),this.addGlobalSceneSettings(),Tt.traverse(function(c){if(c.userData.transformData){c.parent&&(c.userData.transformData.parentMatrix=c.parent.matrix,c.userData.transformData.parentMatrixWorld=c.parent.matrixWorld);const l=Mo(c.userData.transformData);c.applyMatrix4(l),c.updateWorldMatrix()}});const s=new ch().parse();Tt.children.length===1&&Tt.children[0].isGroup&&(Tt.children[0].animations=s,Tt=Tt.children[0]),Tt.animations=s}parseModels(t,e,i){const r=new Map,a=Oe.Objects.Model;for(const o in a){const s=parseInt(o),c=a[o],l=lt.get(s);let d=this.buildSkeleton(l,t,s,c.attrName);if(!d){switch(c.attrType){case"Camera":d=this.createCamera(l);break;case"Light":d=this.createLight(l);break;case"Mesh":d=this.createMesh(l,e,i);break;case"NurbsCurve":d=this.createCurve(l,e);break;case"LimbNode":case"Root":d=new Bi;break;case"Null":default:d=new Hn;break}d.name=c.attrName?Xn.sanitizeNodeName(c.attrName):"",d.userData.originalName=c.attrName,d.ID=s}this.getTransformData(d,c),r.set(s,d)}return r}buildSkeleton(t,e,i,r){let a=null;return t.parents.forEach(function(o){for(const s in e){const c=e[s];c.rawBones.forEach(function(l,d){if(l.ID===o.ID){const u=a;a=new Bi,a.matrixWorld.copy(l.transformLink),a.name=r?Xn.sanitizeNodeName(r):"",a.userData.originalName=r,a.ID=i,c.bones[d]=a,u!==null&&a.add(u)}})}}),a}createCamera(t){let e,i;if(t.children.forEach(function(r){const a=Oe.Objects.NodeAttribute[r.ID];a!==void 0&&(i=a)}),i===void 0)e=new Tn;else{let r=0;i.CameraProjectionType!==void 0&&i.CameraProjectionType.value===1&&(r=1);let a=1;i.NearPlane!==void 0&&(a=i.NearPlane.value/1e3);let o=1e3;i.FarPlane!==void 0&&(o=i.FarPlane.value/1e3);let s=window.innerWidth,c=window.innerHeight;i.AspectWidth!==void 0&&i.AspectHeight!==void 0&&(s=i.AspectWidth.value,c=i.AspectHeight.value);const l=s/c;let d=45;i.FieldOfView!==void 0&&(d=i.FieldOfView.value);const u=i.FocalLength?i.FocalLength.value:null;switch(r){case 0:e=new An(d,l,a,o),u!==null&&e.setFocalLength(u);break;case 1:console.warn("THREE.FBXLoader: Orthographic cameras not supported yet."),e=new Tn;break;default:console.warn("THREE.FBXLoader: Unknown camera type "+r+"."),e=new Tn;break}}return e}createLight(t){let e,i;if(t.children.forEach(function(r){const a=Oe.Objects.NodeAttribute[r.ID];a!==void 0&&(i=a)}),i===void 0)e=new Tn;else{let r;i.LightType===void 0?r=0:r=i.LightType.value;let a=16777215;i.Color!==void 0&&(a=ze.colorSpaceToWorking(new De().fromArray(i.Color.value),dt));let o=i.Intensity===void 0?1:i.Intensity.value/100;i.CastLightOnObject!==void 0&&i.CastLightOnObject.value===0&&(o=0);let s=0;i.FarAttenuationEnd!==void 0&&(i.EnableFarAttenuation!==void 0&&i.EnableFarAttenuation.value===0?s=0:s=i.FarAttenuationEnd.value);const c=1;switch(r){case 0:e=new Oi(a,o,s,c);break;case 1:e=new $a(a,o);break;case 2:let l=Math.PI/3;i.InnerAngle!==void 0&&(l=Et.degToRad(i.InnerAngle.value));let d=0;i.OuterAngle!==void 0&&(d=Et.degToRad(i.OuterAngle.value),d=Math.max(d,1)),e=new ja(a,o,s,l,d,c);break;default:console.warn("THREE.FBXLoader: Unknown light type "+i.LightType.value+", defaulting to a PointLight."),e=new Oi(a,o);break}i.CastShadows!==void 0&&i.CastShadows.value===1&&(e.castShadow=!0)}return e}createMesh(t,e,i){let r,a=null,o=null;const s=[];if(t.children.forEach(function(c){e.has(c.ID)&&(a=e.get(c.ID)),i.has(c.ID)&&s.push(i.get(c.ID))}),s.length>1?o=s:s.length>0?o=s[0]:(o=new $n({name:ci.DEFAULT_MATERIAL_NAME,color:13421772}),s.push(o)),"color"in a.attributes&&s.forEach(function(c){c.vertexColors=!0}),a.groups.length>0){let c=!1;for(let l=0,d=a.groups.length;l<d;l++){const u=a.groups[l];(u.materialIndex<0||u.materialIndex>=s.length)&&(u.materialIndex=s.length,c=!0)}if(c){const l=new $n;s.push(l)}}return a.FBX_Deformer?(r=new eo(a,o),r.normalizeSkinWeights()):r=new It(a,o),r}createCurve(t,e){const i=t.children.reduce(function(a,o){return e.has(o.ID)&&(a=e.get(o.ID)),a},null),r=new Qa({name:ci.DEFAULT_MATERIAL_NAME,color:3342591,linewidth:1});return new to(i,r)}getTransformData(t,e){const i={};"InheritType"in e&&(i.inheritType=parseInt(e.InheritType.value)),"RotationOrder"in e?i.eulerOrder=Kn(e.RotationOrder.value):i.eulerOrder=Kn(0),"Lcl_Translation"in e&&(i.translation=e.Lcl_Translation.value),"PreRotation"in e&&(i.preRotation=e.PreRotation.value),"Lcl_Rotation"in e&&(i.rotation=e.Lcl_Rotation.value),"PostRotation"in e&&(i.postRotation=e.PostRotation.value),"Lcl_Scaling"in e&&(i.scale=e.Lcl_Scaling.value),"ScalingOffset"in e&&(i.scalingOffset=e.ScalingOffset.value),"ScalingPivot"in e&&(i.scalingPivot=e.ScalingPivot.value),"RotationOffset"in e&&(i.rotationOffset=e.RotationOffset.value),"RotationPivot"in e&&(i.rotationPivot=e.RotationPivot.value),t.userData.transformData=i}setLookAtProperties(t,e){"LookAtProperty"in e&&lt.get(t.ID).children.forEach(function(r){if(r.relationship==="LookAtProperty"){const a=Oe.Objects.Model[r.ID];if("Lcl_Translation"in a){const o=a.Lcl_Translation.value;t.target!==void 0?(t.target.position.fromArray(o),Tt.add(t.target)):t.lookAt(new Re().fromArray(o))}}})}bindSkeleton(t,e,i){const r=this.parsePoseNodes();for(const a in t){const o=t[a];lt.get(parseInt(o.ID)).parents.forEach(function(c){if(e.has(c.ID)){const l=c.ID;lt.get(l).parents.forEach(function(u){i.has(u.ID)&&i.get(u.ID).bind(new no(o.bones),r[u.ID])})}})}}parsePoseNodes(){const t={};if("Pose"in Oe.Objects){const e=Oe.Objects.Pose;for(const i in e)if(e[i].attrType==="BindPose"&&e[i].NbPoseNodes>0){const r=e[i].PoseNode;Array.isArray(r)?r.forEach(function(a){t[a.Node]=new ke().fromArray(a.Matrix.a)}):t[r.Node]=new ke().fromArray(r.Matrix.a)}}return t}addGlobalSceneSettings(){if("GlobalSettings"in Oe){if("AmbientColor"in Oe.GlobalSettings){const t=Oe.GlobalSettings.AmbientColor.value,e=t[0],i=t[1],r=t[2];if(e!==0||i!==0||r!==0){const a=new De().setRGB(e,i,r,dt);Tt.add(new sc(a,1))}}"UnitScaleFactor"in Oe.GlobalSettings&&(Tt.userData.unitScaleFactor=Oe.GlobalSettings.UnitScaleFactor.value)}}}class sh{constructor(){this.negativeMaterialIndices=!1}parse(t){const e=new Map;if("Geometry"in Oe.Objects){const i=Oe.Objects.Geometry;for(const r in i){const a=lt.get(parseInt(r)),o=this.parseGeometry(a,i[r],t);e.set(parseInt(r),o)}}return this.negativeMaterialIndices===!0&&console.warn("THREE.FBXLoader: The FBX file contains invalid (negative) material indices. The asset might not render as expected."),e}parseGeometry(t,e,i){switch(e.attrType){case"Mesh":return this.parseMeshGeometry(t,e,i);case"NurbsCurve":return this.parseNurbsGeometry(e)}}parseMeshGeometry(t,e,i){const r=i.skeletons,a=[],o=t.parents.map(function(u){return Oe.Objects.Model[u.ID]});if(o.length===0)return;const s=t.children.reduce(function(u,f){return r[f.ID]!==void 0&&(u=r[f.ID]),u},null);t.children.forEach(function(u){i.morphTargets[u.ID]!==void 0&&a.push(i.morphTargets[u.ID])});const c=o[0],l={};"RotationOrder"in c&&(l.eulerOrder=Kn(c.RotationOrder.value)),"InheritType"in c&&(l.inheritType=parseInt(c.InheritType.value)),"GeometricTranslation"in c&&(l.translation=c.GeometricTranslation.value),"GeometricRotation"in c&&(l.rotation=c.GeometricRotation.value),"GeometricScaling"in c&&(l.scale=c.GeometricScaling.value);const d=Mo(l);return this.genGeometry(e,s,a,d)}genGeometry(t,e,i,r){const a=new an;t.attrName&&(a.name=t.attrName);const o=this.parseGeoNode(t,e),s=this.genBuffers(o),c=new en(s.vertex,3);if(c.applyMatrix4(r),a.setAttribute("position",c),s.colors.length>0&&a.setAttribute("color",new en(s.colors,3)),e&&(a.setAttribute("skinIndex",new qa(s.weightsIndices,4)),a.setAttribute("skinWeight",new en(s.vertexWeights,4)),a.FBX_Deformer=e),s.normal.length>0){const l=new He().getNormalMatrix(r),d=new en(s.normal,3);d.applyNormalMatrix(l),a.setAttribute("normal",d)}if(s.uvs.forEach(function(l,d){const u=d===0?"uv":`uv${d}`;a.setAttribute(u,new en(s.uvs[d],2))}),o.material&&o.material.mappingType!=="AllSame"){let l=s.materialIndex[0],d=0;if(s.materialIndex.forEach(function(u,f){u!==l&&(a.addGroup(d,f-d,l),l=u,d=f)}),a.groups.length>0){const u=a.groups[a.groups.length-1],f=u.start+u.count;f!==s.materialIndex.length&&a.addGroup(f,s.materialIndex.length-f,l)}a.groups.length===0&&a.addGroup(0,s.materialIndex.length,s.materialIndex[0])}return this.addMorphTargets(a,t,i,r),a}parseGeoNode(t,e){const i={};if(i.vertexPositions=t.Vertices!==void 0?t.Vertices.a:[],i.vertexIndices=t.PolygonVertexIndex!==void 0?t.PolygonVertexIndex.a:[],t.LayerElementColor&&t.LayerElementColor[0].Colors&&(i.color=this.parseVertexColors(t.LayerElementColor[0])),t.LayerElementMaterial&&(i.material=this.parseMaterialIndices(t.LayerElementMaterial[0])),t.LayerElementNormal&&(i.normal=this.parseNormals(t.LayerElementNormal[0])),t.LayerElementUV){i.uv=[];let r=0;for(;t.LayerElementUV[r];)t.LayerElementUV[r].UV&&i.uv.push(this.parseUVs(t.LayerElementUV[r])),r++}return i.weightTable={},e!==null&&(i.skeleton=e,e.rawBones.forEach(function(r,a){r.indices.forEach(function(o,s){i.weightTable[o]===void 0&&(i.weightTable[o]=[]),i.weightTable[o].push({id:a,weight:r.weights[s]})})})),i}genBuffers(t){const e={vertex:[],normal:[],colors:[],uvs:[],materialIndex:[],vertexWeights:[],weightsIndices:[]};let i=0,r=0,a=!1,o=[],s=[],c=[],l=[],d=[],u=[];const f=this;return t.vertexIndices.forEach(function(_,S){let R,m=!1;_<0&&(_=_^-1,m=!0);let h=[],T=[];if(o.push(_*3,_*3+1,_*3+2),t.color){const M=Jn(S,i,_,t.color);c.push(M[0],M[1],M[2])}if(t.skeleton){if(t.weightTable[_]!==void 0&&t.weightTable[_].forEach(function(M){T.push(M.weight),h.push(M.id)}),T.length>4){a||(console.warn("THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights."),a=!0);const M=[0,0,0,0],A=[0,0,0,0];T.forEach(function(I,P){let D=I,v=h[P];A.forEach(function(x,q,C){if(D>x){C[q]=D,D=x;const G=M[q];M[q]=v,v=G}})}),h=M,T=A}for(;T.length<4;)T.push(0),h.push(0);for(let M=0;M<4;++M)d.push(T[M]),u.push(h[M])}if(t.normal){const M=Jn(S,i,_,t.normal);s.push(M[0],M[1],M[2])}t.material&&t.material.mappingType!=="AllSame"&&(R=Jn(S,i,_,t.material)[0],R<0&&(f.negativeMaterialIndices=!0,R=0)),t.uv&&t.uv.forEach(function(M,A){const I=Jn(S,i,_,M);l[A]===void 0&&(l[A]=[]),l[A].push(I[0]),l[A].push(I[1])}),r++,m&&(f.genFace(e,t,o,R,s,c,l,d,u,r),i++,r=0,o=[],s=[],c=[],l=[],d=[],u=[])}),e}getNormalNewell(t){const e=new Re(0,0,0);for(let i=0;i<t.length;i++){const r=t[i],a=t[(i+1)%t.length];e.x+=(r.y-a.y)*(r.z+a.z),e.y+=(r.z-a.z)*(r.x+a.x),e.z+=(r.x-a.x)*(r.y+a.y)}return e.normalize(),e}getNormalTangentAndBitangent(t){const e=this.getNormalNewell(t),r=(Math.abs(e.z)>.5?new Re(0,1,0):new Re(0,0,1)).cross(e).normalize(),a=e.clone().cross(r).normalize();return{normal:e,tangent:r,bitangent:a}}flattenVertex(t,e,i){return new vt(t.dot(e),t.dot(i))}genFace(t,e,i,r,a,o,s,c,l,d){let u;if(d>3){const f=[],_=e.baseVertexPositions||e.vertexPositions;for(let h=0;h<i.length;h+=3)f.push(new Re(_[i[h]],_[i[h+1]],_[i[h+2]]));const{tangent:S,bitangent:R}=this.getNormalTangentAndBitangent(f),m=[];for(const h of f)m.push(this.flattenVertex(h,S,R));u=cc.triangulateShape(m,[])}else u=[[0,1,2]];for(const[f,_,S]of u)t.vertex.push(e.vertexPositions[i[f*3]]),t.vertex.push(e.vertexPositions[i[f*3+1]]),t.vertex.push(e.vertexPositions[i[f*3+2]]),t.vertex.push(e.vertexPositions[i[_*3]]),t.vertex.push(e.vertexPositions[i[_*3+1]]),t.vertex.push(e.vertexPositions[i[_*3+2]]),t.vertex.push(e.vertexPositions[i[S*3]]),t.vertex.push(e.vertexPositions[i[S*3+1]]),t.vertex.push(e.vertexPositions[i[S*3+2]]),e.skeleton&&(t.vertexWeights.push(c[f*4]),t.vertexWeights.push(c[f*4+1]),t.vertexWeights.push(c[f*4+2]),t.vertexWeights.push(c[f*4+3]),t.vertexWeights.push(c[_*4]),t.vertexWeights.push(c[_*4+1]),t.vertexWeights.push(c[_*4+2]),t.vertexWeights.push(c[_*4+3]),t.vertexWeights.push(c[S*4]),t.vertexWeights.push(c[S*4+1]),t.vertexWeights.push(c[S*4+2]),t.vertexWeights.push(c[S*4+3]),t.weightsIndices.push(l[f*4]),t.weightsIndices.push(l[f*4+1]),t.weightsIndices.push(l[f*4+2]),t.weightsIndices.push(l[f*4+3]),t.weightsIndices.push(l[_*4]),t.weightsIndices.push(l[_*4+1]),t.weightsIndices.push(l[_*4+2]),t.weightsIndices.push(l[_*4+3]),t.weightsIndices.push(l[S*4]),t.weightsIndices.push(l[S*4+1]),t.weightsIndices.push(l[S*4+2]),t.weightsIndices.push(l[S*4+3])),e.color&&(t.colors.push(o[f*3]),t.colors.push(o[f*3+1]),t.colors.push(o[f*3+2]),t.colors.push(o[_*3]),t.colors.push(o[_*3+1]),t.colors.push(o[_*3+2]),t.colors.push(o[S*3]),t.colors.push(o[S*3+1]),t.colors.push(o[S*3+2])),e.material&&e.material.mappingType!=="AllSame"&&(t.materialIndex.push(r),t.materialIndex.push(r),t.materialIndex.push(r)),e.normal&&(t.normal.push(a[f*3]),t.normal.push(a[f*3+1]),t.normal.push(a[f*3+2]),t.normal.push(a[_*3]),t.normal.push(a[_*3+1]),t.normal.push(a[_*3+2]),t.normal.push(a[S*3]),t.normal.push(a[S*3+1]),t.normal.push(a[S*3+2])),e.uv&&e.uv.forEach(function(R,m){t.uvs[m]===void 0&&(t.uvs[m]=[]),t.uvs[m].push(s[m][f*2]),t.uvs[m].push(s[m][f*2+1]),t.uvs[m].push(s[m][_*2]),t.uvs[m].push(s[m][_*2+1]),t.uvs[m].push(s[m][S*2]),t.uvs[m].push(s[m][S*2+1])})}addMorphTargets(t,e,i,r){if(i.length===0)return;t.morphTargetsRelative=!0,t.morphAttributes.position=[];const a=this;i.forEach(function(o){o.rawTargets.forEach(function(s){const c=Oe.Objects.Geometry[s.geoID];c!==void 0&&a.genMorphGeometry(t,e,c,r,s.name)})})}genMorphGeometry(t,e,i,r,a){const o=e.Vertices!==void 0?e.Vertices.a:[],s=e.PolygonVertexIndex!==void 0?e.PolygonVertexIndex.a:[],c=i.Vertices!==void 0?i.Vertices.a:[],l=i.Indexes!==void 0?i.Indexes.a:[],d=t.attributes.position.count*3,u=new Float32Array(d);for(let R=0;R<l.length;R++){const m=l[R]*3;u[m]=c[R*3],u[m+1]=c[R*3+1],u[m+2]=c[R*3+2]}const f={vertexIndices:s,vertexPositions:u,baseVertexPositions:o},_=this.genBuffers(f),S=new en(_.vertex,3);S.name=a||i.attrName,S.applyMatrix4(r),t.morphAttributes.position.push(S)}parseNormals(t){const e=t.MappingInformationType,i=t.ReferenceInformationType,r=t.Normals.a;let a=[];return i==="IndexToDirect"&&("NormalIndex"in t?a=t.NormalIndex.a:"NormalsIndex"in t&&(a=t.NormalsIndex.a)),{dataSize:3,buffer:r,indices:a,mappingType:e,referenceType:i}}parseUVs(t){const e=t.MappingInformationType,i=t.ReferenceInformationType,r=t.UV.a;let a=[];return i==="IndexToDirect"&&(a=t.UVIndex.a),{dataSize:2,buffer:r,indices:a,mappingType:e,referenceType:i}}parseVertexColors(t){const e=t.MappingInformationType,i=t.ReferenceInformationType,r=t.Colors.a;let a=[];i==="IndexToDirect"&&(a=t.ColorIndex.a);for(let o=0,s=new De;o<r.length;o+=4)s.fromArray(r,o),ze.colorSpaceToWorking(s,dt),s.toArray(r,o);return{dataSize:4,buffer:r,indices:a,mappingType:e,referenceType:i}}parseMaterialIndices(t){const e=t.MappingInformationType,i=t.ReferenceInformationType;if(e==="NoMappingInformation")return{dataSize:1,buffer:[0],indices:[0],mappingType:"AllSame",referenceType:i};const r=t.Materials.a,a=[];for(let o=0;o<r.length;++o)a.push(o);return{dataSize:1,buffer:r,indices:a,mappingType:e,referenceType:i}}parseNurbsGeometry(t){const e=parseInt(t.Order);if(isNaN(e))return console.error("THREE.FBXLoader: Invalid Order %s given for geometry ID: %s",t.Order,t.id),new an;const i=e-1,r=t.KnotVector.a,a=[],o=t.Points.a;for(let u=0,f=o.length;u<f;u+=4)a.push(new pt().fromArray(o,u));let s,c;if(t.Form==="Closed")a.push(a[0]);else if(t.Form==="Periodic"){s=i,c=r.length-1-s;for(let u=0;u<i;++u)a.push(a[u])}const d=new ah(i,r,a,s,c).getPoints(a.length*12);return new an().setFromPoints(d)}}class ch{parse(){const t=[],e=this.parseClips();if(e!==void 0)for(const i in e){const r=e[i],a=this.addClip(r);t.push(a)}return t}parseClips(){if(Oe.Objects.AnimationCurve===void 0)return;const t=this.parseAnimationCurveNodes();this.parseAnimationCurves(t);const e=this.parseAnimationLayers(t);return this.parseAnimStacks(e)}parseAnimationCurveNodes(){const t=Oe.Objects.AnimationCurveNode,e=new Map;for(const i in t){const r=t[i];if(r.attrName.match(/S|R|T|DeformPercent/)!==null){const a={id:r.id,attr:r.attrName,curves:{}};e.set(a.id,a)}}return e}parseAnimationCurves(t){const e=Oe.Objects.AnimationCurve;for(const i in e){const r={id:e[i].id,times:e[i].KeyTime.a.map(ph),values:e[i].KeyValueFloat.a},a=lt.get(r.id);if(a!==void 0){const o=a.parents[0].ID,s=a.parents[0].relationship;s.match(/X/)?t.get(o).curves.x=r:s.match(/Y/)?t.get(o).curves.y=r:s.match(/Z/)?t.get(o).curves.z=r:s.match(/DeformPercent/)&&t.has(o)&&(t.get(o).curves.morph=r)}}}parseAnimationLayers(t){const e=Oe.Objects.AnimationLayer,i=new Map;for(const r in e){const a=[],o=lt.get(parseInt(r));o!==void 0&&(o.children.forEach(function(c,l){if(t.has(c.ID)){const d=t.get(c.ID);if(d.curves.x!==void 0||d.curves.y!==void 0||d.curves.z!==void 0){if(a[l]===void 0){const u=lt.get(c.ID).parents.filter(function(f){return f.relationship!==void 0})[0].ID;if(u!==void 0){const f=Oe.Objects.Model[u.toString()];if(f===void 0){console.warn("THREE.FBXLoader: Encountered a unused curve.",c);return}const _={modelName:f.attrName?Xn.sanitizeNodeName(f.attrName):"",ID:f.id,initialPosition:[0,0,0],initialRotation:[0,0,0],initialScale:[1,1,1]};Tt.traverse(function(S){S.ID===f.id&&(_.transform=S.matrix,S.userData.transformData&&(_.eulerOrder=S.userData.transformData.eulerOrder))}),_.transform||(_.transform=new ke),"PreRotation"in f&&(_.preRotation=f.PreRotation.value),"PostRotation"in f&&(_.postRotation=f.PostRotation.value),a[l]=_}}a[l]&&(a[l][d.attr]=d)}else if(d.curves.morph!==void 0){if(a[l]===void 0){const u=lt.get(c.ID).parents.filter(function(h){return h.relationship!==void 0})[0].ID,f=lt.get(u).parents[0].ID,_=lt.get(f).parents[0].ID,S=lt.get(_).parents[0].ID,R=Oe.Objects.Model[S],m={modelName:R.attrName?Xn.sanitizeNodeName(R.attrName):"",morphName:Oe.Objects.Deformer[u].attrName};a[l]=m}a[l][d.attr]=d}}}),i.set(parseInt(r),a))}return i}parseAnimStacks(t){const e=Oe.Objects.AnimationStack,i={};for(const r in e){const a=lt.get(parseInt(r)).children;a.length>1&&console.warn("THREE.FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.");const o=t.get(a[0].ID);i[r]={name:e[r].attrName,layer:o}}return i}addClip(t){let e=[];const i=this;return t.layer.forEach(function(r){e=e.concat(i.generateTracks(r))}),new io(t.name,-1,e)}generateTracks(t){const e=[];let i=new Re,r=new Re;if(t.transform&&t.transform.decompose(i,new Nt,r),i=i.toArray(),r=r.toArray(),t.T!==void 0&&Object.keys(t.T.curves).length>0){const a=this.generateVectorTrack(t.modelName,t.T.curves,i,"position");a!==void 0&&e.push(a)}if(t.R!==void 0&&Object.keys(t.R.curves).length>0){const a=this.generateRotationTrack(t.modelName,t.R.curves,t.preRotation,t.postRotation,t.eulerOrder);a!==void 0&&e.push(a)}if(t.S!==void 0&&Object.keys(t.S.curves).length>0){const a=this.generateVectorTrack(t.modelName,t.S.curves,r,"scale");a!==void 0&&e.push(a)}if(t.DeformPercent!==void 0){const a=this.generateMorphTrack(t);a!==void 0&&e.push(a)}return e}generateVectorTrack(t,e,i,r){const a=this.getTimesForAllAxes(e),o=this.getKeyframeTrackValues(a,e,i);return new Gi(t+"."+r,a,o)}generateRotationTrack(t,e,i,r,a){let o,s;if(e.x!==void 0&&e.y!==void 0&&e.z!==void 0){const f=this.interpolateRotations(e.x,e.y,e.z,a);o=f[0],s=f[1]}const c=Kn(0);i!==void 0&&(i=i.map(Et.degToRad),i.push(c),i=new Xt().fromArray(i),i=new Nt().setFromEuler(i)),r!==void 0&&(r=r.map(Et.degToRad),r.push(c),r=new Xt().fromArray(r),r=new Nt().setFromEuler(r).invert());const l=new Nt,d=new Xt,u=[];if(!s||!o)return new li(t+".quaternion",[0],[0]);for(let f=0;f<s.length;f+=3)d.set(s[f],s[f+1],s[f+2],a),l.setFromEuler(d),i!==void 0&&l.premultiply(i),r!==void 0&&l.multiply(r),f>2&&new Nt().fromArray(u,(f-3)/3*4).dot(l)<0&&l.set(-l.x,-l.y,-l.z,-l.w),l.toArray(u,f/3*4);return new li(t+".quaternion",o,u)}generateMorphTrack(t){const e=t.DeformPercent.curves.morph,i=e.values.map(function(a){return a/100}),r=Tt.getObjectByName(t.modelName).morphTargetDictionary[t.morphName];return new Hi(t.modelName+".morphTargetInfluences["+r+"]",e.times,i)}getTimesForAllAxes(t){let e=[];if(t.x!==void 0&&(e=e.concat(t.x.times)),t.y!==void 0&&(e=e.concat(t.y.times)),t.z!==void 0&&(e=e.concat(t.z.times)),e=e.sort(function(i,r){return i-r}),e.length>1){let i=1,r=e[0];for(let a=1;a<e.length;a++){const o=e[a];o!==r&&(e[i]=o,r=o,i++)}e=e.slice(0,i)}return e}getKeyframeTrackValues(t,e,i){const r=i,a=[];let o=-1,s=-1,c=-1;return t.forEach(function(l){if(e.x&&(o=e.x.times.indexOf(l)),e.y&&(s=e.y.times.indexOf(l)),e.z&&(c=e.z.times.indexOf(l)),o!==-1){const d=e.x.values[o];a.push(d),r[0]=d}else a.push(r[0]);if(s!==-1){const d=e.y.values[s];a.push(d),r[1]=d}else a.push(r[1]);if(c!==-1){const d=e.z.values[c];a.push(d),r[2]=d}else a.push(r[2])}),a}interpolateRotations(t,e,i,r){const a=[],o=[];a.push(t.times[0]),o.push(Et.degToRad(t.values[0])),o.push(Et.degToRad(e.values[0])),o.push(Et.degToRad(i.values[0]));for(let s=1;s<t.values.length;s++){const c=[t.values[s-1],e.values[s-1],i.values[s-1]];if(isNaN(c[0])||isNaN(c[1])||isNaN(c[2]))continue;const l=c.map(Et.degToRad),d=[t.values[s],e.values[s],i.values[s]];if(isNaN(d[0])||isNaN(d[1])||isNaN(d[2]))continue;const u=d.map(Et.degToRad),f=[d[0]-c[0],d[1]-c[1],d[2]-c[2]],_=[Math.abs(f[0]),Math.abs(f[1]),Math.abs(f[2])];if(_[0]>=180||_[1]>=180||_[2]>=180){const R=Math.max(..._)/180,m=new Xt(...l,r),h=new Xt(...u,r),T=new Nt().setFromEuler(m),M=new Nt().setFromEuler(h);T.dot(M)&&M.set(-M.x,-M.y,-M.z,-M.w);const A=t.times[s-1],I=t.times[s]-A,P=new Nt,D=new Xt;for(let v=0;v<1;v+=1/R)P.copy(T.clone().slerp(M.clone(),v)),a.push(A+v*I),D.setFromQuaternion(P,r),o.push(D.x),o.push(D.y),o.push(D.z)}else a.push(t.times[s]),o.push(Et.degToRad(t.values[s])),o.push(Et.degToRad(e.values[s])),o.push(Et.degToRad(i.values[s]))}return[a,o]}}class lh{getPrevNode(){return this.nodeStack[this.currentIndent-2]}getCurrentNode(){return this.nodeStack[this.currentIndent-1]}getCurrentProp(){return this.currentProp}pushStack(t){this.nodeStack.push(t),this.currentIndent+=1}popStack(){this.nodeStack.pop(),this.currentIndent-=1}setCurrentProp(t,e){this.currentProp=t,this.currentPropName=e}parse(t){this.currentIndent=0,this.allNodes=new To,this.nodeStack=[],this.currentProp=[],this.currentPropName="";const e=this,i=t.split(/[\r\n]+/);return i.forEach(function(r,a){const o=r.match(/^[\s\t]*;/),s=r.match(/^[\s\t]*$/);if(o||s)return;const c=r.match("^\\t{"+e.currentIndent+"}(\\w+):(.*){",""),l=r.match("^\\t{"+e.currentIndent+"}(\\w+):[\\s\\t\\r\\n](.*)"),d=r.match("^\\t{"+(e.currentIndent-1)+"}}");c?e.parseNodeBegin(r,c):l?e.parseNodeProperty(r,l,i[++a]):d?e.popStack():r.match(/^[^\s\t}]/)&&e.parseNodePropertyContinued(r)}),this.allNodes}parseNodeBegin(t,e){const i=e[1].trim().replace(/^"/,"").replace(/"$/,""),r=e[2].split(",").map(function(c){return c.trim().replace(/^"/,"").replace(/"$/,"")}),a={name:i},o=this.parseNodeAttr(r),s=this.getCurrentNode();this.currentIndent===0?this.allNodes.add(i,a):i in s?(i==="PoseNode"?s.PoseNode.push(a):s[i].id!==void 0&&(s[i]={},s[i][s[i].id]=s[i]),o.id!==""&&(s[i][o.id]=a)):typeof o.id=="number"?(s[i]={},s[i][o.id]=a):i!=="Properties70"&&(i==="PoseNode"?s[i]=[a]:s[i]=a),typeof o.id=="number"&&(a.id=o.id),o.name!==""&&(a.attrName=o.name),o.type!==""&&(a.attrType=o.type),this.pushStack(a)}parseNodeAttr(t){let e=t[0];t[0]!==""&&(e=parseInt(t[0]),isNaN(e)&&(e=t[0]));let i="",r="";return t.length>1&&(i=t[1].replace(/^(\w+)::/,""),r=t[2]),{id:e,name:i,type:r}}parseNodeProperty(t,e,i){let r=e[1].replace(/^"/,"").replace(/"$/,"").trim(),a=e[2].replace(/^"/,"").replace(/"$/,"").trim();r==="Content"&&a===","&&(a=i.replace(/"/g,"").replace(/,$/,"").trim());const o=this.getCurrentNode();if(o.name==="Properties70"){this.parseNodeSpecialProperty(t,r,a);return}if(r==="C"){const c=a.split(",").slice(1),l=parseInt(c[0]),d=parseInt(c[1]);let u=a.split(",").slice(3);u=u.map(function(f){return f.trim().replace(/^"/,"")}),r="connections",a=[l,d],mh(a,u),o[r]===void 0&&(o[r]=[])}r==="Node"&&(o.id=a),r in o&&Array.isArray(o[r])?o[r].push(a):r!=="a"?o[r]=a:o.a=a,this.setCurrentProp(o,r),r==="a"&&a.slice(-1)!==","&&(o.a=Ui(a))}parseNodePropertyContinued(t){const e=this.getCurrentNode();e.a+=t,t.slice(-1)!==","&&(e.a=Ui(e.a))}parseNodeSpecialProperty(t,e,i){const r=i.split('",').map(function(d){return d.trim().replace(/^\"/,"").replace(/\s/,"_")}),a=r[0],o=r[1],s=r[2],c=r[3];let l=r[4];switch(o){case"int":case"enum":case"bool":case"ULongLong":case"double":case"Number":case"FieldOfView":l=parseFloat(l);break;case"Color":case"ColorRGB":case"Vector3D":case"Lcl_Translation":case"Lcl_Rotation":case"Lcl_Scaling":l=Ui(l);break}this.getPrevNode()[a]={type:o,type2:s,flag:c,value:l},this.setCurrentProp(this.getPrevNode(),a)}}class fh{parse(t){const e=new Ta(t);e.skip(23);const i=e.getUint32();if(i<6400)throw new Error("THREE.FBXLoader: FBX version not supported, FileVersion: "+i);const r=new To;for(;!this.endOfContent(e);){const a=this.parseNode(e,i);a!==null&&r.add(a.name,a)}return r}endOfContent(t){return t.size()%16===0?(t.getOffset()+160+16&-16)>=t.size():t.getOffset()+160+16>=t.size()}parseNode(t,e){const i={},r=e>=7500?t.getUint64():t.getUint32(),a=e>=7500?t.getUint64():t.getUint32();e>=7500?t.getUint64():t.getUint32();const o=t.getUint8(),s=t.getString(o);if(r===0)return null;const c=[];for(let f=0;f<a;f++)c.push(this.parseProperty(t));const l=c.length>0?c[0]:"",d=c.length>1?c[1]:"",u=c.length>2?c[2]:"";for(i.singleProperty=a===1&&t.getOffset()===r;r>t.getOffset();){const f=this.parseNode(t,e);f!==null&&this.parseSubNode(s,i,f)}return i.propertyList=c,typeof l=="number"&&(i.id=l),d!==""&&(i.attrName=d),u!==""&&(i.attrType=u),s!==""&&(i.name=s),i}parseSubNode(t,e,i){if(i.singleProperty===!0){const r=i.propertyList[0];Array.isArray(r)?(e[i.name]=i,i.a=r):e[i.name]=r}else if(t==="Connections"&&i.name==="C"){const r=[];i.propertyList.forEach(function(a,o){o!==0&&r.push(a)}),e.connections===void 0&&(e.connections=[]),e.connections.push(r)}else if(i.name==="Properties70")Object.keys(i).forEach(function(a){e[a]=i[a]});else if(t==="Properties70"&&i.name==="P"){let r=i.propertyList[0],a=i.propertyList[1];const o=i.propertyList[2],s=i.propertyList[3];let c;r.indexOf("Lcl ")===0&&(r=r.replace("Lcl ","Lcl_")),a.indexOf("Lcl ")===0&&(a=a.replace("Lcl ","Lcl_")),a==="Color"||a==="ColorRGB"||a==="Vector"||a==="Vector3D"||a.indexOf("Lcl_")===0?c=[i.propertyList[4],i.propertyList[5],i.propertyList[6]]:c=i.propertyList[4],e[r]={type:a,type2:o,flag:s,value:c}}else e[i.name]===void 0?typeof i.id=="number"?(e[i.name]={},e[i.name][i.id]=i):e[i.name]=i:i.name==="PoseNode"?(Array.isArray(e[i.name])||(e[i.name]=[e[i.name]]),e[i.name].push(i)):e[i.name][i.id]===void 0&&(e[i.name][i.id]=i)}parseProperty(t){const e=t.getString(1);let i;switch(e){case"C":return t.getBoolean();case"D":return t.getFloat64();case"F":return t.getFloat32();case"I":return t.getInt32();case"L":return t.getInt64();case"R":return i=t.getUint32(),t.getArrayBuffer(i);case"S":return i=t.getUint32(),t.getString(i);case"Y":return t.getInt16();case"b":case"c":case"d":case"f":case"i":case"l":const r=t.getUint32(),a=t.getUint32(),o=t.getUint32();if(a===0)switch(e){case"b":case"c":return t.getBooleanArray(r);case"d":return t.getFloat64Array(r);case"f":return t.getFloat32Array(r);case"i":return t.getInt32Array(r);case"l":return t.getInt64Array(r)}const s=jp(new Uint8Array(t.getArrayBuffer(o))),c=new Ta(s.buffer);switch(e){case"b":case"c":return c.getBooleanArray(r);case"d":return c.getFloat64Array(r);case"f":return c.getFloat32Array(r);case"i":return c.getInt32Array(r);case"l":return c.getInt64Array(r)}break;default:throw new Error("THREE.FBXLoader: Unknown property type "+e)}}}class Ta{constructor(t,e){this.dv=new DataView(t),this.offset=0,this.littleEndian=e!==void 0?e:!0,this._textDecoder=new TextDecoder}getOffset(){return this.offset}size(){return this.dv.buffer.byteLength}skip(t){this.offset+=t}getBoolean(){return(this.getUint8()&1)===1}getBooleanArray(t){const e=[];for(let i=0;i<t;i++)e.push(this.getBoolean());return e}getUint8(){const t=this.dv.getUint8(this.offset);return this.offset+=1,t}getInt16(){const t=this.dv.getInt16(this.offset,this.littleEndian);return this.offset+=2,t}getInt32(){const t=this.dv.getInt32(this.offset,this.littleEndian);return this.offset+=4,t}getInt32Array(t){const e=[];for(let i=0;i<t;i++)e.push(this.getInt32());return e}getUint32(){const t=this.dv.getUint32(this.offset,this.littleEndian);return this.offset+=4,t}getInt64(){let t,e;return this.littleEndian?(t=this.getUint32(),e=this.getUint32()):(e=this.getUint32(),t=this.getUint32()),e&2147483648?(e=~e&4294967295,t=~t&4294967295,t===4294967295&&(e=e+1&4294967295),t=t+1&4294967295,-(e*4294967296+t)):e*4294967296+t}getInt64Array(t){const e=[];for(let i=0;i<t;i++)e.push(this.getInt64());return e}getUint64(){let t,e;return this.littleEndian?(t=this.getUint32(),e=this.getUint32()):(e=this.getUint32(),t=this.getUint32()),e*4294967296+t}getFloat32(){const t=this.dv.getFloat32(this.offset,this.littleEndian);return this.offset+=4,t}getFloat32Array(t){const e=[];for(let i=0;i<t;i++)e.push(this.getFloat32());return e}getFloat64(){const t=this.dv.getFloat64(this.offset,this.littleEndian);return this.offset+=8,t}getFloat64Array(t){const e=[];for(let i=0;i<t;i++)e.push(this.getFloat64());return e}getArrayBuffer(t){const e=this.dv.buffer.slice(this.offset,this.offset+t);return this.offset+=t,e}getString(t){const e=this.offset;let i=new Uint8Array(this.dv.buffer,e,t);this.skip(t);const r=i.indexOf(0);return r>=0&&(i=new Uint8Array(this.dv.buffer,e,r)),this._textDecoder.decode(i)}}class To{add(t,e){this[t]=e}}function uh(n){const t="Kaydara FBX Binary  \0";return n.byteLength>=t.length&&t===Ao(n,0,t.length)}function dh(n){const t=["K","a","y","d","a","r","a","\\","F","B","X","\\","B","i","n","a","r","y","\\","\\"];let e=0;function i(r){const a=n[r-1];return n=n.slice(e+r),e++,a}for(let r=0;r<t.length;++r)if(i(1)===t[r])return!1;return!0}function Ma(n){const t=/FBXVersion: (\d+)/,e=n.match(t);if(e)return parseInt(e[1]);throw new Error("THREE.FBXLoader: Cannot find the version number for the file given.")}function ph(n){return n/46186158e3}const hh=[];function Jn(n,t,e,i){let r;switch(i.mappingType){case"ByPolygonVertex":r=n;break;case"ByPolygon":r=t;break;case"ByVertice":r=e;break;case"AllSame":r=i.indices[0];break;default:console.warn("THREE.FBXLoader: unknown attribute mapping type "+i.mappingType)}i.referenceType==="IndexToDirect"&&(r=i.indices[r]);const a=r*i.dataSize,o=a+i.dataSize;return _h(hh,i.buffer,a,o)}const Di=new Xt,vn=new Re;function Mo(n){const t=new ke,e=new ke,i=new ke,r=new ke,a=new ke,o=new ke,s=new ke,c=new ke,l=new ke,d=new ke,u=new ke,f=new ke,_=n.inheritType?n.inheritType:0;n.translation&&t.setPosition(vn.fromArray(n.translation));const S=Kn(0);if(n.preRotation){const C=n.preRotation.map(Et.degToRad);C.push(S),e.makeRotationFromEuler(Di.fromArray(C))}if(n.rotation){const C=n.rotation.map(Et.degToRad);C.push(n.eulerOrder||S),i.makeRotationFromEuler(Di.fromArray(C))}if(n.postRotation){const C=n.postRotation.map(Et.degToRad);C.push(S),r.makeRotationFromEuler(Di.fromArray(C)),r.invert()}n.scale&&a.scale(vn.fromArray(n.scale)),n.scalingOffset&&s.setPosition(vn.fromArray(n.scalingOffset)),n.scalingPivot&&o.setPosition(vn.fromArray(n.scalingPivot)),n.rotationOffset&&c.setPosition(vn.fromArray(n.rotationOffset)),n.rotationPivot&&l.setPosition(vn.fromArray(n.rotationPivot)),n.parentMatrixWorld&&(u.copy(n.parentMatrix),d.copy(n.parentMatrixWorld));const R=e.clone().multiply(i).multiply(r),m=new ke;m.extractRotation(d);const h=new ke;h.copyPosition(d);const T=h.clone().invert().multiply(d),M=m.clone().invert().multiply(T),A=a,I=new ke;if(_===0)I.copy(m).multiply(R).multiply(M).multiply(A);else if(_===1)I.copy(m).multiply(M).multiply(R).multiply(A);else{const G=new ke().scale(new Re().setFromMatrixScale(u)).clone().invert(),k=M.clone().multiply(G);I.copy(m).multiply(R).multiply(k).multiply(A)}const P=l.clone().invert(),D=o.clone().invert();let v=t.clone().multiply(c).multiply(l).multiply(e).multiply(i).multiply(r).multiply(P).multiply(s).multiply(o).multiply(a).multiply(D);const x=new ke().copyPosition(v),q=d.clone().multiply(x);return f.copyPosition(q),v=f.clone().multiply(I),v.premultiply(d.invert()),v}function Kn(n){n=n||0;const t=["ZYX","YZX","XZY","ZXY","YXZ","XYZ"];return n===6?(console.warn("THREE.FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect."),t[0]):t[n]}function Ui(n){return n.split(",").map(function(e){return parseFloat(e)})}function Ao(n,t,e){return t===void 0&&(t=0),e===void 0&&(e=n.byteLength),new TextDecoder().decode(new Uint8Array(n,t,e))}function mh(n,t){for(let e=0,i=n.length,r=t.length;e<r;e++,i++)n[i]=t[e]}function _h(n,t,e,i){for(let r=e,a=0;r<i;r++,a++)n[a]=t[r];return n}export{Eh as F,Sh as G,Ie as S,vh as W};
//# sourceMappingURL=FBXLoader-DMLbIWWV.js.map
