//#region node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, p = f.trustedTypes, re = p ? p.emptyScript : "", ie = f.reactiveElementPolyfillSupport, m = (e, t) => e, h = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? re : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, g = (e, t) => !l(e, t), _ = {
	attribute: !0,
	type: String,
	converter: h,
	reflect: !1,
	useDefault: !1,
	hasChanged: g
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = _) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? _;
	}
	static _$Ei() {
		if (this.hasOwnProperty(m("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(m("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(m("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? h : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? h : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? g)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[m("elementProperties")] = /* @__PURE__ */ new Map(), v[m("finalized")] = /* @__PURE__ */ new Map(), ie?.({ ReactiveElement: v }), (f.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var y = globalThis, b = (e) => e, x = y.trustedTypes, S = x ? x.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, C = "$lit$", w = `lit$${Math.random().toFixed(9).slice(2)}$`, ae = "?" + w, oe = `<${ae}>`, T = document, E = () => T.createComment(""), D = (e) => e === null || typeof e != "object" && typeof e != "function", O = Array.isArray, se = (e) => O(e) || typeof e?.[Symbol.iterator] == "function", k = "[ 	\n\f\r]", A = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ce = /-->/g, le = />/g, j = RegExp(`>|${k}(?:([^\\s"'>=/]+)(${k}*=${k}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ue = /'/g, de = /"/g, M = /^(?:script|style|textarea|title)$/i, N = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), P = N(1), F = N(2), I = Symbol.for("lit-noChange"), L = Symbol.for("lit-nothing"), R = /* @__PURE__ */ new WeakMap(), z = T.createTreeWalker(T, 129);
function B(e, t) {
	if (!O(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return S === void 0 ? t : S.createHTML(t);
}
var fe = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = A;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === A ? c[1] === "!--" ? o = ce : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = j) : (M.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = j) : o = le : o === j ? c[0] === ">" ? (o = i ?? A, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? j : c[3] === "\"" ? de : ue) : o === de || o === ue ? o = j : o === ce || o === le ? o = A : (o = j, i = void 0);
		let d = o === j && e[t + 1].startsWith("/>") ? " " : "";
		a += o === A ? n + oe : l >= 0 ? (r.push(s), n.slice(0, l) + C + n.slice(l) + w + d) : n + w + (l === -2 ? t : d);
	}
	return [B(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, V = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = fe(t, n);
		if (this.el = e.createElement(l, r), z.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = z.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(C)) {
					let t = u[o++], n = i.getAttribute(e).split(w), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? me : r[1] === "?" ? he : r[1] === "@" ? ge : W
					}), i.removeAttribute(e);
				} else e.startsWith(w) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (M.test(i.tagName)) {
					let e = i.textContent.split(w), t = e.length - 1;
					if (t > 0) {
						i.textContent = x ? x.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], E()), z.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], E());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === ae) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(w, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += w.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = T.createElement("template");
		return n.innerHTML = e, n;
	}
};
function H(e, t, n = e, r) {
	if (t === I) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = D(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = H(e, i._$AS(e, t.values), i, r)), t;
}
var pe = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? T).importNode(t, !0);
		z.currentNode = r;
		let i = z.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new U(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new _e(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = z.nextNode(), a++);
		}
		return z.currentNode = T, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, U = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = L, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = H(this, e, t), D(e) ? e === L || e == null || e === "" ? (this._$AH !== L && this._$AR(), this._$AH = L) : e !== this._$AH && e !== I && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? se(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== L && D(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = V.createElement(B(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new pe(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = R.get(e.strings);
		return t === void 0 && R.set(e.strings, t = new V(e)), t;
	}
	k(t) {
		O(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(E()), this.O(E()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = b(e).nextSibling;
			b(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, W = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = L, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = L;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = H(this, e, t, 0), a = !D(e) || e !== this._$AH && e !== I, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = H(this, r[n + o], t, o), s === I && (s = this._$AH[o]), a ||= !D(s) || s !== this._$AH[o], s === L ? e = L : e !== L && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === L ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, me = class extends W {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === L ? void 0 : e;
	}
}, he = class extends W {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== L);
	}
}, ge = class extends W {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = H(this, e, t, 0) ?? L) === I) return;
		let n = this._$AH, r = e === L && n !== L || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== L && (n === L || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, _e = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		H(this, e);
	}
}, ve = y.litHtmlPolyfillSupport;
ve?.(V, U), (y.litHtmlVersions ??= []).push("3.3.3");
var ye = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new U(t.insertBefore(E(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, G = globalThis, K = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ye(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return I;
	}
};
K._$litElement$ = !0, K.finalized = !0, G.litElementHydrateSupport?.({ LitElement: K });
var be = G.litElementPolyfillSupport;
be?.({ LitElement: K }), (G.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/preview.ts
var q = 440, xe = 98, Se = 50, Ce = 42, we = 312, Te = q / 2, Ee = 156, J = (e) => ({
	x: Te + (e.x + e.y) * xe,
	y: Ee + (e.x - e.y) * Se - e.z * Ce
}), Y = (e) => e.map((e) => `${J(e).x},${J(e).y}`).join(" "), De = (e) => e.reduce((e, t) => e + t.x - t.y, 0) / e.length, X = (e) => e.placed ?? e.position;
function Oe(e, t, n) {
	let r = e.slice(1).map((t, n) => Math.hypot(t.x - e[n].x, t.y - e[n].y)), i = r.reduce((e, t) => e + t, 0), a = (t) => {
		let n = t * i;
		for (let t = 0; t < r.length; t++) {
			if (n <= r[t] || t === r.length - 1) {
				let i = r[t] ? Math.min(1, n / r[t]) : 0;
				return {
					x: e[t].x + (e[t + 1].x - e[t].x) * i,
					y: e[t].y + (e[t + 1].y - e[t].y) * i
				};
			}
			n -= r[t];
		}
		return e[e.length - 1];
	};
	return [a(t), a(n)];
}
var ke = class extends K {
	constructor(...e) {
		super(...e), this.channels = [], this.lightInfo = [], this.colors = {}, this.active = !1;
	}
	static {
		this.properties = {
			channels: { attribute: !1 },
			lightInfo: { attribute: !1 },
			colors: { attribute: !1 },
			active: { type: Boolean },
			hovered: { state: !0 }
		};
	}
	lights() {
		let e = new Map(this.lightInfo.map((e) => [e.id, e])), t = /* @__PURE__ */ new Map();
		for (let n of this.channels) {
			let r = n.light_id ?? `ch${n.id}`;
			if (!t.has(r)) {
				let i = e.get(r);
				t.set(r, {
					id: r,
					name: n.light ?? n.lights[0],
					channels: [],
					positions: i?.positions.length ? i.positions : [],
					segmentCount: i?.segment_count ?? 1
				});
			}
			t.get(r).channels.push(n);
		}
		for (let e of t.values()) e.channels.sort((e, t) => (e.segment ?? 0) - (t.segment ?? 0));
		return [...t.values()].sort((e, t) => e.name.localeCompare(t.name));
	}
	color(e) {
		return this.colors[String(e.id)] ?? "#000000";
	}
	paint(e) {
		this.dispatchEvent(new CustomEvent("paint", { detail: { channels: e.map((e) => e.id) } }));
	}
	hover(e) {
		this.hovered = e;
	}
	render() {
		if (!this.channels.length) return P`<div class="empty">
        Choose an entertainment area to see its lights.
      </div>`;
		let e = this.lights(), t = [...e].sort((e, t) => De(e.positions.length ? e.positions : e.channels.map(X)) - De(t.positions.length ? t.positions : t.channels.map(X)));
		return P`
      <div class="stage">
        <svg viewBox="0 0 ${q} ${we}" class=${this.active ? "live" : "faded"}>
          <polygon
            class="wall left"
            points=${Y([
			{
				x: -1,
				y: 1,
				z: -1
			},
			{
				x: -1,
				y: -1,
				z: -1
			},
			{
				x: -1,
				y: -1,
				z: 1
			},
			{
				x: -1,
				y: 1,
				z: 1
			}
		])}
          ></polygon>
          <polygon
            class="wall front"
            points=${Y([
			{
				x: -1,
				y: 1,
				z: -1
			},
			{
				x: 1,
				y: 1,
				z: -1
			},
			{
				x: 1,
				y: 1,
				z: 1
			},
			{
				x: -1,
				y: 1,
				z: 1
			}
		])}
          ></polygon>
          <polygon
            class="floor"
            points=${Y([
			{
				x: -1,
				y: 1,
				z: -1
			},
			{
				x: 1,
				y: 1,
				z: -1
			},
			{
				x: 1,
				y: -1,
				z: -1
			},
			{
				x: -1,
				y: -1,
				z: -1
			}
		])}
          ></polygon>
          <!-- 16:9 on screen (walls are drawn flatter than the floor), at the height
               the Hue app shows it: TV backlights around the middle of the screen -->
          <polygon
            class="tv"
            points=${Y([
			{
				x: -.3,
				y: 1,
				z: -.42
			},
			{
				x: .3,
				y: 1,
				z: -.42
			},
			{
				x: .3,
				y: 1,
				z: .46
			},
			{
				x: -.3,
				y: 1,
				z: .46
			}
		])}
          ></polygon>
          ${t.map((e) => e.positions.length > 1 ? this.bar(e) : this.dot(e))}
        </svg>
        <div class="hint">
          ${this.hovered ? `${this.hovered.name} · channel ${this.hovered.channels.map((e) => e.id).join(", ")}` : "\xA0"}
        </div>
      </div>
      <div class="legend">
        ${e.map((e) => P`
            <button
              class="chip"
              title="Paint ${e.name}"
              @click=${() => this.paint(e.channels)}
              @mouseenter=${() => this.hover(e)}
              @mouseleave=${() => this.hover()}
            >
              <span class="swatch">
                ${e.channels.map((e) => P`<span style="background:${this.color(e)}"></span>`)}
              </span>
              <span class="chip-name">${e.name}</span>
              <span class="ids">${e.channels.map((e) => e.id).join(", ")}</span>
            </button>
          `)}
      </div>
    `;
	}
	pole(e) {
		if (e.z <= -.97) return F``;
		let t = J({
			...e,
			z: -1
		}), n = J(e);
		return F`
      <line class="pole" x1=${t.x} y1=${t.y} x2=${n.x} y2=${n.y}></line>
      <ellipse class="foot" cx=${t.x} cy=${t.y} rx="4.5" ry="2.2"></ellipse>
    `;
	}
	dot(e) {
		let t = e.channels[0], n = e.positions[0] ?? X(t), { x: r, y: i } = J(n), a = this.color(t), o = this.hovered === e;
		return F`
      <g class="light" @click=${() => this.paint([t])}
        @mouseenter=${() => this.hover(e)} @mouseleave=${() => this.hover()}>
        ${this.pole(n)}
        <circle cx=${r} cy=${i} r="14" fill=${a} class="glow"></circle>
        <circle cx=${r} cy=${i} r="7" fill=${a} class=${o ? "core hot" : "core"}></circle>
      </g>
    `;
	}
	bar(e) {
		let t = e.positions.map(J), n = (e) => e.map((e, t) => `${t ? "L" : "M"}${e.x},${e.y}`).join(" "), r = t[0], i = t[t.length - 1], a = `g-${e.id}`, o = e.channels.length, s = e.channels.map((e, t) => F`<stop offset=${o > 1 ? t / (o - 1) : 0} stop-color=${this.color(e)}></stop>`), c = this.hovered === e;
		return F`
      <g class="light" @mouseenter=${() => this.hover(e)} @mouseleave=${() => this.hover()}>
        ${this.pole(e.positions[0])} ${this.pole(e.positions[e.positions.length - 1])}
        <defs>
          <linearGradient id=${a} gradientUnits="userSpaceOnUse"
            x1=${r.x} y1=${r.y} x2=${i.x} y2=${i.y}>${s}</linearGradient>
        </defs>
        <path d=${n(t)} stroke=${`url(#${a})`} class="bar-glow"></path>
        <path d=${n(t)} class="bar-edge"></path>
        <path d=${n(t)} stroke=${`url(#${a})`} class=${c ? "bar hot" : "bar"}></path>
        ${e.channels.map((e, r) => F`<path class="hit-bar" d=${n(Oe(t, r / o, (r + 1) / o))}
            @click=${() => this.paint([e])}></path>`)}
      </g>
    `;
	}
	static {
		this.styles = o`
    .stage {
      max-width: 600px;
      margin: 0 auto;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .wall,
    .floor {
      stroke: var(--divider-color);
      stroke-width: 0.75;
    }
    .floor {
      fill: var(--secondary-background-color, rgba(127, 127, 127, 0.12));
    }
    .wall.left {
      fill: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
    }
    .wall.front {
      fill: var(--primary-background-color, rgba(127, 127, 127, 0.04));
    }
    .tv {
      fill: var(--secondary-text-color);
      opacity: 0.35;
    }
    .pole {
      stroke: var(--secondary-text-color);
      stroke-width: 1.5;
      stroke-linecap: round;
      opacity: 0.5;
    }
    .foot {
      fill: var(--secondary-text-color);
      opacity: 0.35;
    }
    .glow {
      opacity: 0.3;
    }
    .core {
      stroke: #fff;
      stroke-width: 1.5;
    }
    .bar {
      fill: none;
      stroke-width: 7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .bar-edge {
      fill: none;
      stroke: #fff;
      stroke-width: 10;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .faded .bar-edge {
      opacity: 0.6;
    }
    .bar-glow {
      fill: none;
      stroke-width: 18;
      stroke-linecap: round;
      opacity: 0.18;
    }
    .faded .glow,
    .faded .bar-glow {
      display: none;
    }
    .faded .core,
    .faded .bar {
      opacity: 0.45;
    }
    .light {
      cursor: pointer;
    }
    .hit-bar {
      fill: none;
      stroke: transparent;
      stroke-width: 26;
      pointer-events: stroke;
    }
    .core.hot {
      stroke: var(--primary-text-color);
      stroke-width: 2;
    }
    .bar.hot {
      stroke-width: 10;
    }
    .hint {
      text-align: center;
      font-size: 13px;
      color: var(--secondary-text-color);
      min-height: 18px;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
      margin-top: 8px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px 4px 6px;
      border-radius: 14px;
      border: 1px solid var(--divider-color);
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .chip:hover {
      border-color: var(--primary-color);
    }
    .swatch {
      display: inline-flex;
      border-radius: 50%;
      overflow: hidden;
      width: 16px;
      height: 16px;
      border: 1px solid var(--divider-color);
    }
    .swatch span {
      flex: 1;
    }
    .ids {
      color: var(--secondary-text-color);
      font-size: 12px;
    }
    .empty {
      color: var(--secondary-text-color);
      padding: 24px 0;
      text-align: center;
    }
  `;
	}
};
customElements.define("hue-room-preview", ke);
//#endregion
//#region src/fields.ts
function Ae(e, t, n, r) {
	let i = e.replace(/_/g, " ");
	if (t.type === "color") return P`
      <label class="field">
        <span>${i}</span>
        <input
          type="color"
          .value=${Me(n)}
          @input=${(e) => r(e.target.value)}
        />
      </label>
    `;
	if (t.type === "number") {
		let e = Number(n), a = t.min ?? 0, o = t.max ?? Math.max(1, Number(t.default) * 2);
		return P`
      <label class="field">
        <span>${i}</span>
        <ha-slider
          min=${a}
          max=${o}
          step=${(o - a) / 100}
          .value=${e}
          @input=${(e) => r(Number(e.target.value))}
        ></ha-slider>
        <span class="small num">${Ne(e)}</span>
      </label>
    `;
	}
	let a = t.options ?? [];
	return a.length === 2 && a.every((e) => typeof e == "boolean") ? P`
      <label class="field">
        <span>${i}</span>
        <ha-switch
          .checked=${!!n}
          @change=${(e) => r(e.target.checked)}
        ></ha-switch>
      </label>
    ` : P`
    <label class="field">
      <span>${i}</span>
      <select
        @change=${(e) => r(a[Number(e.target.value)])}
      >
        ${a.map((e, t) => P`<option value=${t} ?selected=${e === n}>${String(e)}</option>`)}
      </select>
    </label>
  `;
}
var je = o`
  .field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .field span:first-child {
    color: var(--secondary-text-color);
    font-size: 14px;
    text-transform: capitalize;
    min-width: 90px;
  }
  .field ha-slider {
    flex: 1;
    min-width: 0;
  }
  .small {
    font-size: 13px;
  }
  .num {
    min-width: 36px;
    text-align: right;
  }
  select {
    font: inherit;
    color: inherit;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--secondary-background-color, transparent);
  }
  input[type="color"] {
    width: 44px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }
`;
function Me(e) {
	return typeof e == "string" && /^#?[0-9a-f]{6}/i.test(e) ? `#${e.replace("#", "").slice(0, 6)}` : Array.isArray(e) && e.length >= 3 ? `#${e.slice(0, 3).map((e) => Math.max(0, Math.min(255, Math.round(Number(e)))).toString(16).padStart(2, "0")).join("")}` : "#000000";
}
function Ne(e) {
	return Math.abs(e) >= 10 ? e.toFixed(0) : String(Number(e.toFixed(2)));
}
//#endregion
//#region src/scene-editor.ts
var Z = Math.sqrt(3) / 2, Pe = class extends K {
	constructor(...e) {
		super(...e), this.params = {}, this.sceneJson = "", this.previewError = "", this.points = [], this.planes = [], this.dotRadius = 0, this.previewRun = 0;
	}
	static {
		this.properties = {
			getScene: { attribute: !1 },
			subscribePreview: { attribute: !1 },
			scene: { state: !0 },
			params: { state: !0 },
			sceneJson: { state: !0 },
			previewError: { state: !0 }
		};
	}
	async open(e, t = {}) {
		this.dialog?.showModal(), this.scene = void 0, this.params = t, this.sceneJson = "", this.previewError = "", this.layoutPreviewGrid(), this.drawPreview();
		let n = await this.getScene?.(e);
		this.sceneJson = JSON.stringify(n, null, 2), n && this.startPreview(n);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stopPreview();
	}
	get dialog() {
		return this.shadowRoot?.querySelector("dialog");
	}
	get previewCanvas() {
		return this.shadowRoot?.getElementById("scene-preview");
	}
	close() {
		this.dialog?.close();
	}
	values(e) {
		return Object.fromEntries(Object.entries(e.parameters ?? {}).map(([e, t]) => [e, e in this.params ? this.params[e] : t.default]));
	}
	setValue(e, t) {
		this.params = {
			...this.params,
			[e]: t
		};
		let n = this.scene;
		n && (clearTimeout(this.editTimer), this.editTimer = window.setTimeout(() => this.startPreview(n), 300));
	}
	onEdit(e) {
		clearTimeout(this.editTimer), this.editTimer = window.setTimeout(() => {
			try {
				this.startPreview(JSON.parse(e));
			} catch (e) {
				this.previewError = e.message;
			}
		}, 300);
	}
	async startPreview(e) {
		this.stopPreview();
		let t = this.previewRun;
		try {
			let n = await this.subscribePreview?.(e, this.points.map((e) => e.position), this.values(e), (e) => this.drawPreview(e));
			t === this.previewRun ? (this.unsubscribePreview = n, this.previewError = "", this.scene = e) : n?.();
		} catch (e) {
			t === this.previewRun && (this.previewError = e.message);
		}
	}
	stopPreview() {
		clearTimeout(this.editTimer), this.previewRun++, this.unsubscribePreview?.(), this.unsubscribePreview = void 0;
	}
	layoutPreviewGrid() {
		let e = this.previewCanvas;
		if (!e) return;
		let t = Math.min((e.width - 16) / (2 * Z * 16), (e.height - 16) / 26.5), n = e.width / 2, r = e.height / 2, i = (e, i, a) => [n + (e - a) * t * Z, r + ((e + a - 15) * .5 - i + 5) * t], a = (e, t) => e / (t - 1) * 2 - 1, o = (e, ...t) => ({
			fill: `rgba(0, 0, 0, ${e})`,
			corners: t.map(([e, t, n]) => i(e, t, n))
		}), s = -.5, c = 15.5, l = 10.5;
		this.planes = [
			o(.14, [
				s,
				s,
				s
			], [
				c,
				s,
				s
			], [
				c,
				s,
				c
			], [
				s,
				s,
				c
			]),
			o(.07, [
				s,
				s,
				s
			], [
				s,
				s,
				c
			], [
				s,
				l,
				c
			], [
				s,
				l,
				s
			]),
			o(.03, [
				s,
				s,
				s
			], [
				c,
				s,
				s
			], [
				c,
				l,
				s
			], [
				s,
				l,
				s
			])
		], this.points = [];
		for (let e = 0; e < 16; e++) for (let t = 0; t < 11; t++) for (let n = 0; n < 16; n++) {
			if ([
				e,
				t,
				n
			].filter((e) => e === 0).length !== 1) continue;
			let [r, o] = i(e, t, n);
			this.points.push({
				x: r,
				y: o,
				position: [
					a(e, 16),
					a(n, 16),
					a(t, 11)
				]
			});
		}
		this.dotRadius = t * .3;
	}
	drawPreview(e) {
		let t = this.previewCanvas, n = t?.getContext("2d");
		if (t && n) {
			n.clearRect(0, 0, t.width, t.height), n.strokeStyle = "rgba(0, 0, 0, 0.3)", n.lineWidth = 1;
			for (let e of this.planes) n.fillStyle = e.fill, n.beginPath(), e.corners.forEach(([e, t]) => n.lineTo(e, t)), n.closePath(), n.fill(), n.stroke();
			this.points.forEach((t, r) => {
				n.fillStyle = e?.[r] ?? "#ffffff", n.beginPath(), n.arc(t.x, t.y, this.dotRadius, 0, Math.PI * 2), n.fill();
			});
		}
	}
	render() {
		let e = this.scene;
		return P`
      <dialog
        @close=${() => this.stopPreview()}
        @click=${(e) => {
			e.target === e.currentTarget && this.close();
		}}
      >
        <div class="header">
          <span class="title">${e?.name ?? ""}</span>
          <ha-icon-button .label=${"Close"} @click=${() => this.close()}>
            <ha-icon icon="mdi:close"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="content">
          <div>${e?.description ?? ""}</div>
          <div class="panes">
            <div class="editor-pane">${this.renderEditor()}</div>
            <div class="preview-pane">
              <canvas id="scene-preview" width="440" height="440"></canvas>
            </div>
          </div>
          ${this.renderSettings()}
          ${this.previewError ? P`<div class="error">${this.previewError}</div>` : L}
        </div>
        <div class="footer">
          <ha-button size="s" appearance="plain" @click=${() => this.close()}>
            Close
          </ha-button>
        </div>
      </dialog>
    `;
	}
	renderEditor() {
		return customElements.get("ha-code-editor") ? P`<ha-code-editor
          mode="yaml"
          .value=${this.sceneJson}
          @value-changed=${(e) => this.onEdit(e.detail.value)}
        ></ha-code-editor>` : P`<textarea
          .value=${this.sceneJson}
          @input=${(e) => this.onEdit(e.target.value)}
        ></textarea>`;
	}
	renderSettings() {
		let e = this.scene, t = Object.entries(e?.parameters ?? {}), n = e ? this.values(e) : {};
		return P`
      <div class="settings">
        ${t.length ? P`<div class="settings-form">
                ${t.map(([e, t]) => Ae(e, t, n[e], (t) => this.setValue(e, t)))}
              </div>` : P`<div class="secondary small">This scene has no settings.</div>`}
      </div>
    `;
	}
	static {
		this.styles = [je, o`
      .title {
        font-size: 16px;
        font-weight: 500;
      }
      .secondary {
        color: var(--secondary-text-color);
      }
      ha-icon-button,
      ha-button {
        --ha-icon-button-size: 24px;
        --mdc-icon-button-size: 24px;
        --mdc-icon-size: 16px;
      }
      /* two 440px panes, a 16px gap, padding */
      dialog {
        width: min(928px, calc(100vw - 32px));
        padding: 0;
        border: none;
        border-radius: var(--ha-card-border-radius, 12px);
        background: var(--card-background-color, var(--primary-background-color));
        color: var(--primary-text-color);
        box-shadow: var(--ha-card-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.3));
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 0;
      }
      .content {
        display: grid;
        gap: 12px;
        padding: 16px;
      }
      .panes {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px;
      }
      .editor-pane,
      .preview-pane {
        width: 100%;
        aspect-ratio: 1;
        background: var(--primary-background-color);
        overflow: hidden;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
      }
      .editor-pane ha-code-editor,
      .editor-pane textarea {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        --code-mirror-height: 100%;
      }
      .editor-pane textarea {
        border: none;
        padding: 8px;
        resize: none;
        font-family: var(--code-font-family, monospace);
        background: transparent;
        color: inherit;
      }
      .preview-pane canvas {
        max-width: 100%;
      }
      .settings-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 8px;
        column-gap: 16px;
        column-rule: 1px solid var(--divider-color);
      }
      .settings {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px;
      }
      .footer {
        display: flex;
        justify-content: flex-end;
        padding: 0 16px 16px;
      }
      .error {
        color: var(--error-color);
      }
    `];
	}
};
customElements.define("hue-scene-editor", Pe);
//#endregion
//#region src/scenes.ts
var Fe = class extends K {
	constructor(...e) {
		super(...e), this.scenes = [], this.playing = null, this.playingParams = null, this.speed = 1, this.disabled = !1, this.drafts = {};
	}
	static {
		this.properties = {
			scenes: { attribute: !1 },
			playing: { attribute: !1 },
			playingParams: { attribute: !1 },
			speed: { type: Number },
			disabled: { type: Boolean },
			selected: { state: !0 },
			drafts: { state: !0 },
			speedDraft: { state: !0 }
		};
	}
	get current() {
		let e = this.selected ?? this.playing ?? this.scenes[0]?.id;
		return this.scenes.find((t) => t.id === e);
	}
	values(e) {
		let t = Object.fromEntries(Object.entries(e.parameters).map(([e, t]) => [e, t.default])), n = e.id === this.playing ? this.playingParams ?? {} : {};
		return {
			...t,
			...n,
			...this.drafts[e.id] ?? {}
		};
	}
	setValue(e, t, n) {
		this.drafts = {
			...this.drafts,
			[e.id]: {
				...this.drafts[e.id] ?? {},
				[t]: n
			}
		};
	}
	fire(e, t = {}) {
		this.dispatchEvent(new CustomEvent(e, { detail: t }));
	}
	play(e, t) {
		this.fire("play", {
			scene: e.id,
			params: t
		});
	}
	reloadScenes() {
		this.fire("reload-scenes");
	}
	downloadScene(e) {
		this.fire("download-scene", { scene: e.id });
	}
	uploadScene() {
		(this.shadowRoot?.getElementById("scene-upload"))?.click();
	}
	handleUpload(e) {
		let t = e.target;
		if (!t.files?.length) return;
		let n = t.files[0], r = new FileReader();
		r.onload = () => {
			try {
				let e = JSON.parse(r.result);
				this.fire("upload-scene", { scene: e });
			} catch (e) {
				console.error("Failed to parse scene file", e);
			}
		}, r.readAsText(n);
	}
	render() {
		let e = this.current;
		return P`
      <div class="grid">
        ${this.renderList()} ${e ? this.renderForm(e) : L}
      </div>
    `;
	}
	renderList() {
		let e = this.speedDraft ?? this.speed;
		return P`
      <input
        type="file"
        id="scene-upload"
        accept=".json"
        style="display: none"
        @change=${(e) => this.handleUpload(e)}
      />
      <ha-card
        ><div class="card-content">
          <div class="row">
            <span class="value">Scenes</span>
            <span>
              <ha-button
                appearance="plain"
                variant="secondary"
                size="xs"
                @click=${(e) => {
			e.stopPropagation(), this.reloadScenes();
		}}
              >
                <ha-icon icon="mdi:reload"></ha-icon>
              </ha-button>
              <ha-button
                appearance="filled"
                variant="brand"
                size="xs"
                @click=${(e) => {
			e.stopPropagation(), this.uploadScene();
		}}
              >
                <ha-icon icon="mdi:upload"></ha-icon>
                Upload Scene
              </ha-button>
            </span>
          </div>
          <div class="list">
            ${this.scenes.map((e) => {
			let t = e.id === this.playing;
			return P`
                <div
                  class="scene ${t ? "on" : ""} ${e.id === this.current?.id ? "selected" : ""}"
                  @click=${() => this.selected = e.id}
                >
                  <div class="scene-text">
                    <div class="name">${e.name}</div>
                    ${e.description ? P`<div class="secondary small">${e.description}</div>` : L}
                  </div>
                  <span class="tag">${e.builtin ? "built-in" : "yours"}</span>
                  <ha-button
                    size="xs"
                    appearance=${t ? "accent" : "outlined"}
                    ?disabled=${this.disabled}
                    @click=${(n) => {
				n.stopPropagation(), t ? this.fire("stop") : this.play(e, this.drafts[e.id] ? this.values(e) : void 0);
			}}
                  >
                    ${t ? "Stop" : "Play"}
                  </ha-button>
                </div>
              `;
		})}
          </div>
          <label class="row speed">
            <span class="secondary small">Speed</span>
            <ha-slider
              min="0.1"
              max="4"
              step="0.1"
              .value=${e}
              ?disabled=${this.disabled}
              @input=${(e) => this.speedDraft = Number(e.target.value)}
              @change=${(e) => {
			this.fire("speed", { speed: Number(e.target.value) }), this.speedDraft = void 0;
		}}
            ></ha-slider>
            <span class="small">${e.toFixed(1)}×</span>
          </label>
        </div></ha-card
      >
    `;
	}
	renderForm(e) {
		let t = Object.entries(e.parameters), n = this.values(e);
		return P`
      <ha-card
        ><div class="card-content">
          <div class="row">
            <span class="value">${e.name}</span>
            <div class="row actions">
              <ha-icon-button
                .label=${"Download"}
                @click=${() => this.downloadScene(e)}
              >
                <ha-icon icon="mdi:download"></ha-icon>
              </ha-icon-button>
              ${e.builtin ? L : P`
                      <ha-button
                        size="xs"
                        appearance="plain"
                        variant="danger"
                        @click=${() => this.fire("delete-scene", { scene: e.id })}
                      >
                        <ha-icon icon="mdi:delete"></ha-icon>
                        Delete</ha-button
                      >
                    `}
            </div>
          </div>
          ${t.length ? P`<div class="form">
                  ${t.map(([t, r]) => Ae(t, r, n[t], (n) => this.setValue(e, t, n)))}
                </div>` : P`<div class="secondary small">This scene has no settings.</div>`}
          <div class="row actions">
            <ha-button
              size="s"
              appearance="plain"
              ?disabled=${!this.drafts[e.id]}
              @click=${() => {
			let t = { ...this.drafts };
			delete t[e.id], this.drafts = t;
		}}
            >
              Reset
            </ha-button>
            <ha-button
              size="s"
              appearance="plain"
              @click=${() => this.fire("edit-scene", {
			scene: e.id,
			params: n
		})}
            >
              Preview
            </ha-button>
            <ha-button
              size="s"
              appearance="accent"
              ?disabled=${this.disabled}
              @click=${() => this.play(e, n)}
            >
              ${e.id === this.playing ? "Apply" : "Play with these"}
            </ha-button>
          </div>
        </div></ha-card
      >
    `;
	}
	static {
		this.styles = [je, o`
      .card-content {
        padding: 16px;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .value {
        font-size: 16px;
        font-weight: 500;
      }
      .secondary {
        color: var(--secondary-text-color);
      }
      .small {
        font-size: 13px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }
      .list {
        display: grid;
      }
      .scene {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-top: 1px solid var(--divider-color);
        cursor: pointer;
      }
      .scene.selected {
        background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
        border-radius: 8px;
      }
      .scene.on .name {
        color: var(--primary-color);
        font-weight: 500;
      }
      .scene-text {
        flex: 1;
        min-width: 0;
      }
      .tag {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      ha-icon-button,
      ha-button {
        --ha-icon-button-size: 24px;
        --mdc-icon-button-size: 24px;
        --mdc-icon-size: 16px;
      }
      .speed ha-slider {
        flex: 1;
        min-width: 0;
      }
      .form {
        display: grid;
        gap: 10px;
      }
      .actions {
        justify-content: flex-end;
        gap: 8px;
      }
    `];
	}
};
customElements.define("hue-scene-panel", Fe);
//#endregion
//#region src/panel.ts
var Q = "ha_hue_entertainment", Ie = `/config/integrations/integration/${Q}`, Le = class extends K {
	constructor(...e) {
		super(...e), this.narrow = !1, this.zones = [], this.scenes = [], this.busy = !1, this.colors = {
			channels: {},
			brightness: 1
		}, this.paintColor = "#ff7a00";
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			status: { state: !0 },
			zones: { state: !0 },
			scenes: { state: !0 },
			message: { state: !0 },
			busy: { state: !0 },
			colors: { state: !0 },
			paintColor: { state: !0 },
			brightnessDraft: { state: !0 }
		};
	}
	updated(e) {
		e.has("hass") && this.hass && !this.unsubscribe && this.connect();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.unsubscribe?.(), this.unsubscribe = void 0;
	}
	downloadJson(e, t) {
		let n = new Blob([JSON.stringify(t, null, 2)], { type: "application/json" }), r = URL.createObjectURL(n), i = document.createElement("a");
		i.href = r, i.download = e, i.click(), URL.revokeObjectURL(r);
	}
	async connect() {
		try {
			this.unsubscribe = await this.hass.connection.subscribeMessage((e) => {
				e.type === "status" ? this.status = e : e.type === "colors" && (this.colors = e);
			}, {
				type: `${Q}/subscribe`,
				colors: !0
			}), [this.zones, this.scenes] = await Promise.all([this.call("zones"), this.call("scenes")]);
		} catch (e) {
			this.message = $(e);
		}
	}
	call(e, t = {}) {
		return this.hass.connection.sendMessagePromise({
			type: `${Q}/${e}`,
			...t
		});
	}
	async act(e, t = {}) {
		this.busy = !0;
		try {
			await this.call(e, t), this.message = void 0;
		} catch (e) {
			this.message = $(e);
		} finally {
			this.busy = !1;
		}
	}
	navigate(e) {
		history.pushState(null, "", e), window.dispatchEvent(new CustomEvent("location-changed"));
	}
	render() {
		return P`
      <div class="toolbar">
        <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
        <div class="title">Hue Entertainment</div>
        ${this.renderStatePill()}
      </div>
      <div class="content">
        ${this.status ? P`<div class="cards">
                  ${this.renderBridge()} ${this.renderZone()} ${this.renderToggles()}
                </div>
                ${this.renderMessage()} ${this.renderPreview()} ${this.renderScenes()}` : this.message ? this.renderMessage() : P`<ha-card><div class="card-content">Loading…</div></ha-card>`}
      </div>
    `;
	}
	renderStatePill() {
		let e = this.status?.streaming;
		if (!e) return L;
		let t = this.status?.live, n = e.state === "streaming" && t ? `Live · ${t.client}` : e.state === "streaming" ? `Streaming · ${Math.round(e.send_fps)}/s` : e.state === "reconnecting" ? "Reconnecting" : "Off";
		return P`<span class="pill ${e.state}">${n}</span>`;
	}
	renderBridge() {
		let e = this.status.bridge;
		return P`
      <ha-card
        ><div class="card-content">
          <div class="label">Bridge</div>
          <div class="row">
            <span class="value">${e?.name ?? "Not paired"}</span>
            <span class="secondary">${e?.host ?? ""}</span>
          </div>
          <a
            class="link"
            href=${Ie}
            @click=${(e) => {
			e.preventDefault(), this.navigate(Ie);
		}}
            >Manage in Devices and services</a
          >
        </div></ha-card
      >
    `;
	}
	renderZone() {
		let e = this.status.zone?.id ?? "";
		return P`
      <ha-card
        ><div class="card-content">
          <label class="label" for="zone">Entertainment area</label>
          <select
            id="zone"
            .value=${e}
            ?disabled=${this.busy || !this.zones.length}
            @change=${(e) => this.act("zone/select", { zone_id: e.target.value })}
          >
            ${e ? L : P`<option value="" selected>Choose an area</option>`}
            ${this.zones.map((t) => P`<option value=${t.id} ?selected=${t.id === e}>
                  ${t.name} · ${t.channel_count} channels
                </option>`)}
          </select>
          ${this.zones.length ? L : P`<div class="secondary small">
                  No entertainment areas. Create one in the Hue app under Settings,
                  Entertainment areas.
                </div>`}
        </div></ha-card
      >
    `;
	}
	renderToggles() {
		let e = this.status, t = e.streaming.target_fps !== null;
		return P`
      <ha-card
        ><div class="card-content toggles">
          ${this.toggle("Sync", t, !e.zone, (e) => this.act("sync", { on: e }))}
          ${this.toggle("Allow override", e.allow_override, !1, (e) => this.act("override", { allow: e }), "Starting sync may stop another app, like a Hue Sync Box")}
        </div></ha-card
      >
    `;
	}
	toggle(e, t, n, r, i) {
		return P`
      <label class="toggle-row" title=${i ?? ""}>
        <span>${e}</span>
        <ha-switch
          .checked=${t}
          ?disabled=${n || this.busy}
          @change=${(e) => r(e.target.checked)}
        ></ha-switch>
      </label>
    `;
	}
	renderPreview() {
		let e = this.status, t = e.streaming.target_fps !== null, n = this.brightnessDraft ?? Math.round(this.colors.brightness * 100);
		return P`
      <ha-card
        ><div class="card-content">
          <div class="row">
            <span class="value">Live preview</span>
            <span class="secondary small">
              ${t ? "Select a light to paint it." : "Sync is off. Showing the colours sync starts with."}
            </span>
          </div>
          <hue-room-preview
            .channels=${e.zone_layout?.channels ?? []}
            .lightInfo=${e.zone_layout?.lights ?? []}
            .colors=${this.colors.channels}
            ?active=${t}
            @paint=${(t) => this.act("colors/set", {
			channels: Object.fromEntries(t.detail.channels.map((e) => [e, this.paintColor])),
			overlay: e.scene.id !== null || e.live !== null
		})}
          ></hue-room-preview>
          <div class="row controls">
            <label class="row">
              <input
                type="color"
                .value=${this.paintColor}
                @input=${(e) => this.paintColor = e.target.value}
              />
              <span class="secondary small">Paint colour</span>
            </label>
            <label class="row grow">
              <span class="secondary small">Brightness</span>
              <ha-slider
                class="grow"
                min="0"
                max="100"
                step="1"
                .value=${n}
                @input=${(e) => this.brightnessDraft = Number(e.target.value)}
                @change=${async (e) => {
			await this.act("colors/set", {
				brightness: Number(e.target.value) / 100,
				start: !1
			}), this.brightnessDraft = void 0;
		}}
              ></ha-slider>
              <span class="small">${n}%</span>
            </label>
          </div>
        </div></ha-card
      >
    `;
	}
	renderScenes() {
		let e = this.status;
		return P`
      <hue-scene-panel
        .scenes=${this.scenes}
        .playing=${e.scene.id}
        .playingParams=${e.scene.params}
        .speed=${e.scene.speed}
        ?disabled=${this.busy || !e.zone}
        @play=${(e) => this.act("scene/play", {
			scene: e.detail.scene,
			...e.detail.params ? { params: e.detail.params } : {}
		})}
        @stop=${() => this.act("scene/stop")}
        @speed=${(e) => this.act("speed", { speed: e.detail.speed })}
        @reload-scenes=${async () => {
			try {
				this.scenes = await this.call("scenes/reload"), this.message = void 0;
			} catch (e) {
				this.message = $(e);
			}
		}}
        @download-scene=${(e) => {
			this.call("scene", { scene: e.detail.scene }).then((t) => {
				this.downloadJson(`${e.detail.scene}.json`, t);
			}).catch((e) => {
				this.message = $(e);
			});
		}}
        @upload-scene=${async (e) => {
			try {
				this.scenes = await this.call("scenes/upload", { scene: e.detail.scene }), this.message = void 0;
			} catch (e) {
				this.message = $(e);
			}
		}}
        @delete-scene=${async (e) => {
			if (confirm(`Delete scene ${e.detail.scene}?`)) try {
				this.scenes = await this.call("scenes/delete", { scene_id: e.detail.scene }), this.message = void 0;
			} catch (e) {
				this.message = $(e);
			}
		}}
        @edit-scene=${(e) => (this.shadowRoot?.querySelector("hue-scene-editor"))?.open(e.detail.scene, e.detail.params)}
      ></hue-scene-panel>
      <hue-scene-editor
        .getScene=${(e) => this.call("scene", { scene: e })}
        .subscribePreview=${(e, t, n, r) => this.hass.connection.subscribeMessage((e) => r(e.colors), {
			type: `${Q}/scene/preview`,
			scene: e,
			positions: t,
			params: n
		})}
      ></hue-scene-editor>
    `;
	}
	renderMessage() {
		let e = this.status?.live, t = this.message ?? this.status?.streaming.error;
		return P`
      ${e ? P`<div class="live-bar">
              <span
                >Live control by <b>${e.client}</b> since
                ${(/* @__PURE__ */ new Date(e.since * 1e3)).toLocaleTimeString()}. Painting draws on
                top.</span
              >
              <ha-button
                appearance="accent"
                size="s"
                ?disabled=${this.busy}
                @click=${() => this.act("live/revoke")}
              >
                Take over
              </ha-button>
            </div>` : L}
      ${t ? P`<div class="message" role="alert">${t}</div>` : L}
    `;
	}
	static {
		this.styles = o`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
    }
    .card-content {
      padding: 16px;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
    .row,
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .value {
      font-size: 16px;
      font-weight: 500;
    }
    .secondary {
      color: var(--secondary-text-color);
    }
    .small {
      font-size: 13px;
    }
    select {
      font: inherit;
      color: inherit;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color, transparent);
    }
    input[type="color"] {
      width: 44px;
      height: 28px;
      padding: 0;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: none;
      cursor: pointer;
    }
    .toolbar {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 12px;
      height: var(--header-height, 56px);
      padding: 0 12px;
      background: var(--app-header-background-color, var(--primary-color));
      color: var(--app-header-text-color, var(--text-primary-color));
      border-bottom: var(--app-header-border-bottom);
      font-size: 20px;
    }
    .title {
      flex: 1;
    }
    .pill {
      font-size: 13px;
      padding: 3px 10px;
      border-radius: 12px;
      background: rgba(127, 127, 127, 0.25);
    }
    .pill.streaming {
      background: var(--success-color, #43a047);
      color: #fff;
    }
    .pill.reconnecting {
      background: var(--warning-color, #ffa600);
      color: #000;
    }
    .content {
      padding: 16px;
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .label {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .link {
      font-size: 13px;
      color: var(--primary-color);
      text-decoration: none;
    }
    .toggles {
      gap: 14px;
    }
    .toggle-row span {
      font-size: 15px;
    }
    .controls {
      flex-wrap: wrap;
    }
    .grow {
      flex: 1;
      min-width: 0;
    }
    .live-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(3, 169, 244, 0.12);
      border: 1px solid var(--info-color, #039be5);
    }
    .message {
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(255, 166, 0, 0.15);
      border: 1px solid var(--warning-color, #ffa600);
    }
    ha-button {
      --ha-icon-button-size: 24px;
      --mdc-icon-button-size: 24px;
      --mdc-icon-size: 16px;
    }
  `;
	}
};
function $(e) {
	return e.message ?? String(e);
}
customElements.define("ha-hue-entertainment-panel", Le);
//#endregion
