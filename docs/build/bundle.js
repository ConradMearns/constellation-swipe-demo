
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Card.svelte generated by Svelte v3.31.0 */

    const file = "src/Card.svelte";
    const get_message_slot_changes = dirty => ({});
    const get_message_slot_context = ctx => ({});
    const get_name_slot_changes = dirty => ({});
    const get_name_slot_context = ctx => ({});

    // (43:23)     
    function fallback_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "No Content";
    			attr_dev(span, "class", "missing svelte-nup10n");
    			add_location(span, file, 43, 3, 792);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(43:23)     ",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let article;
    	let h2;
    	let t;
    	let div;
    	let current;
    	const name_slot_template = /*#slots*/ ctx[1].name;
    	const name_slot = create_slot(name_slot_template, ctx, /*$$scope*/ ctx[0], get_name_slot_context);
    	const message_slot_template = /*#slots*/ ctx[1].message;
    	const message_slot = create_slot(message_slot_template, ctx, /*$$scope*/ ctx[0], get_message_slot_context);
    	const message_slot_or_fallback = message_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			h2 = element("h2");
    			if (name_slot) name_slot.c();
    			t = space();
    			div = element("div");
    			if (message_slot_or_fallback) message_slot_or_fallback.c();
    			attr_dev(h2, "class", "svelte-nup10n");
    			add_location(h2, file, 35, 1, 647);
    			attr_dev(div, "class", "message svelte-nup10n");
    			add_location(div, file, 41, 1, 743);
    			attr_dev(article, "class", "contact-card svelte-nup10n");
    			add_location(article, file, 34, 0, 615);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h2);

    			if (name_slot) {
    				name_slot.m(h2, null);
    			}

    			append_dev(article, t);
    			append_dev(article, div);

    			if (message_slot_or_fallback) {
    				message_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (name_slot) {
    				if (name_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(name_slot, name_slot_template, ctx, /*$$scope*/ ctx[0], dirty, get_name_slot_changes, get_name_slot_context);
    				}
    			}

    			if (message_slot) {
    				if (message_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(message_slot, message_slot_template, ctx, /*$$scope*/ ctx[0], dirty, get_message_slot_changes, get_message_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(name_slot, local);
    			transition_in(message_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(name_slot, local);
    			transition_out(message_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (name_slot) name_slot.d(detaching);
    			if (message_slot_or_fallback) message_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['name','message']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/Message.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/Message.svelte";

    // (10:4) <span slot="name">
    function create_name_slot(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("(");
    			t1 = text(/*index*/ ctx[0]);
    			t2 = text("/");
    			t3 = text(/*index_limit*/ ctx[1]);
    			t4 = text(") ");
    			t5 = text(/*id*/ ctx[2]);
    			attr_dev(span, "slot", "name");
    			add_location(span, file$1, 9, 4, 195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(span, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*index*/ 1) set_data_dev(t1, /*index*/ ctx[0]);
    			if (dirty & /*index_limit*/ 2) set_data_dev(t3, /*index_limit*/ ctx[1]);
    			if (dirty & /*id*/ 4) set_data_dev(t5, /*id*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_name_slot.name,
    		type: "slot",
    		source: "(10:4) <span slot=\\\"name\\\">",
    		ctx
    	});

    	return block;
    }

    // (13:4) <span slot="message">
    function create_message_slot(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*body*/ ctx[3]);
    			attr_dev(span, "slot", "message");
    			add_location(span, file$1, 12, 4, 267);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*body*/ 8) set_data_dev(t, /*body*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_message_slot.name,
    		type: "slot",
    		source: "(13:4) <span slot=\\\"message\\\">",
    		ctx
    	});

    	return block;
    }

    // (9:0) <ContactCard>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(9:0) <ContactCard>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let contactcard;
    	let current;

    	contactcard = new Card({
    			props: {
    				$$slots: {
    					default: [create_default_slot],
    					message: [create_message_slot],
    					name: [create_name_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contactcard.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(contactcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const contactcard_changes = {};

    			if (dirty & /*$$scope, body, id, index_limit, index*/ 31) {
    				contactcard_changes.$$scope = { dirty, ctx };
    			}

    			contactcard.$set(contactcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contactcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contactcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Message", slots, []);
    	let { index = 0 } = $$props;
    	let { index_limit = 0 } = $$props;
    	let { id = null } = $$props;
    	let { body = null } = $$props;
    	const writable_props = ["index", "index_limit", "id", "body"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Message> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("index_limit" in $$props) $$invalidate(1, index_limit = $$props.index_limit);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("body" in $$props) $$invalidate(3, body = $$props.body);
    	};

    	$$self.$capture_state = () => ({
    		ContactCard: Card,
    		index,
    		index_limit,
    		id,
    		body
    	});

    	$$self.$inject_state = $$props => {
    		if ("index" in $$props) $$invalidate(0, index = $$props.index);
    		if ("index_limit" in $$props) $$invalidate(1, index_limit = $$props.index_limit);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("body" in $$props) $$invalidate(3, body = $$props.body);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [index, index_limit, id, body];
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { index: 0, index_limit: 1, id: 2, body: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Message",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get index() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index_limit() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index_limit(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get body() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set body(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-swipe/src/Swipe.svelte generated by Svelte v3.31.0 */
    const file$2 = "node_modules/svelte-swipe/src/Swipe.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[42] = list[i];
    	child_ctx[44] = i;
    	return child_ctx;
    }

    // (266:3) {#if showIndicators}
    function create_if_block(ctx) {
    	let div;
    	let each_value = /*indicators*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "swipe-indicator swipe-indicator-inside svelte-j4f7n2");
    			add_location(div, file$2, 266, 5, 6862);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*activeIndicator, changeItem, indicators*/ 70) {
    				each_value = /*indicators*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(266:3) {#if showIndicators}",
    		ctx
    	});

    	return block;
    }

    // (268:8) {#each indicators as x, i }
    function create_each_block(ctx) {
    	let span;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[22](/*i*/ ctx[44]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");

    			attr_dev(span, "class", span_class_value = "dot " + (/*activeIndicator*/ ctx[1] == /*i*/ ctx[44]
    			? "is-active"
    			: "") + " svelte-j4f7n2");

    			add_location(span, file$2, 268, 10, 6963);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*activeIndicator*/ 2 && span_class_value !== (span_class_value = "dot " + (/*activeIndicator*/ ctx[1] == /*i*/ ctx[44]
    			? "is-active"
    			: "") + " svelte-j4f7n2")) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(268:8) {#each indicators as x, i }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let t0;
    	let div3;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);
    	let if_block = /*showIndicators*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			div3 = element("div");
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "swipeable-slot-wrapper svelte-j4f7n2");
    			add_location(div0, file$2, 259, 6, 6623);
    			attr_dev(div1, "class", "swipeable-total_elements svelte-j4f7n2");
    			add_location(div1, file$2, 258, 4, 6577);
    			attr_dev(div2, "class", "swipe-item-wrapper svelte-j4f7n2");
    			add_location(div2, file$2, 257, 2, 6514);
    			attr_dev(div3, "class", "swipe-handler svelte-j4f7n2");
    			add_location(div3, file$2, 264, 2, 6717);
    			attr_dev(div4, "class", "swipe-panel svelte-j4f7n2");
    			add_location(div4, file$2, 256, 0, 6485);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div2_binding*/ ctx[20](div2);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			/*div3_binding*/ ctx[21](div3);
    			append_dev(div4, t1);
    			if (if_block) if_block.m(div4, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div3, "touchstart", /*onMoveStart*/ ctx[5], false, false, false),
    					listen_dev(div3, "mousedown", /*onMoveStart*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty[0] & /*$$scope*/ 262144) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[18], dirty, null, null);
    				}
    			}

    			if (/*showIndicators*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div4, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (default_slot) default_slot.d(detaching);
    			/*div2_binding*/ ctx[20](null);
    			/*div3_binding*/ ctx[21](null);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function normalizeEventBehavior(e) {
    	e && e.preventDefault();
    	e && e.stopImmediatePropagation();
    	e && e.stopPropagation();
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Swipe", slots, ['default']);
    	let { transitionDuration = 200 } = $$props;
    	let { showIndicators = false } = $$props;
    	let { autoplay = false } = $$props;
    	let { delay = 1000 } = $$props;
    	let { defaultIndex = 0 } = $$props;
    	let { active_item = 0 } = $$props; //readonly
    	let { is_vertical = false } = $$props;

    	let activeIndicator = 0,
    		indicators,
    		total_elements = 0,
    		availableSpace = 0,
    		availableWidth = 0,
    		swipeElements,
    		availableDistance = 0,
    		swipeWrapper,
    		swipeHandler,
    		pos_axis = 0,
    		page_axis = is_vertical ? "pageY" : "pageX",
    		axis,
    		longTouch,
    		last_axis_pos;

    	let played = defaultIndex || 0;
    	let run_interval = false;

    	function init() {
    		swipeElements = swipeWrapper.querySelectorAll(".swipeable-item");
    		$$invalidate(16, total_elements = swipeElements.length);
    		update();
    	}

    	function update() {
    		let { offsetWidth, offsetHeight } = swipeWrapper.querySelector(".swipeable-total_elements");
    		availableSpace = is_vertical ? offsetHeight : offsetWidth;

    		[...swipeElements].forEach((element, i) => {
    			element.style.transform = generateTranslateValue(availableSpace * i);
    		});

    		availableDistance = 0;
    		availableWidth = availableSpace * (total_elements - 1);

    		if (defaultIndex) {
    			changeItem(defaultIndex);
    		}
    	}

    	// helpers
    	function eventDelegate(type) {
    		let delegationTypes = {
    			add: "addEventListener",
    			remove: "removeEventListener"
    		};

    		if (typeof window !== "undefined") {
    			window[delegationTypes[type]]("mousemove", onMove);
    			window[delegationTypes[type]]("mouseup", onEnd);
    			window[delegationTypes[type]]("touchmove", onMove, { passive: false });
    			window[delegationTypes[type]]("touchend", onEnd, { passive: false });
    		}
    	}

    	function generateTranslateValue(value) {
    		return is_vertical
    		? `translate3d(0, ${value}px, 0)`
    		: `translate3d(${value}px, 0, 0)`;
    	}

    	function generateTouchPosCss(value, touch_end = false) {
    		let transformString = generateTranslateValue(value);

    		let _css = `
      -webkit-transition-duration: ${touch_end ? transitionDuration : "0"}ms;
      transition-duration: ${touch_end ? transitionDuration : "0"}ms;
      -webkit-transform: ${transformString};
      -ms-transform: ${transformString};`;

    		return _css;
    	}

    	onMount(() => {
    		init();

    		if (typeof window !== "undefined") {
    			window.addEventListener("resize", update);
    		}
    	});

    	onDestroy(() => {
    		if (typeof window !== "undefined") {
    			window.removeEventListener("resize", update);
    		}
    	});

    	let touch_active = false;

    	function onMove(e) {
    		if (touch_active) {
    			normalizeEventBehavior(e);

    			let _axis = e.touches ? e.touches[0][page_axis] : e[page_axis],
    				distance = axis - _axis + pos_axis;

    			if (distance <= availableWidth && distance >= 0) {
    				[...swipeElements].forEach((element, i) => {
    					element.style.cssText = generateTouchPosCss(availableSpace * i - distance);
    				});

    				availableDistance = distance;
    				last_axis_pos = _axis;
    			}
    		}
    	}

    	function onMoveStart(e) {
    		normalizeEventBehavior(e);
    		touch_active = true;
    		longTouch = false;

    		setTimeout(
    			function () {
    				longTouch = true;
    			},
    			250
    		);

    		axis = e.touches ? e.touches[0][page_axis] : e[page_axis];
    		eventDelegate("add");
    	}

    	function onEnd(e) {
    		normalizeEventBehavior(e);
    		let direction = axis < last_axis_pos;
    		touch_active = false;
    		let _as = availableSpace;
    		let accidental_touch = Math.round(availableSpace / 50) > Math.abs(axis - last_axis_pos);

    		if (longTouch || accidental_touch) {
    			availableDistance = Math.round(availableDistance / _as) * _as;
    		} else {
    			availableDistance = direction
    			? Math.floor(availableDistance / _as) * _as
    			: Math.ceil(availableDistance / _as) * _as;
    		}

    		axis = null;
    		last_axis_pos = null;
    		pos_axis = availableDistance;
    		$$invalidate(1, activeIndicator = availableDistance / _as);

    		[...swipeElements].forEach((element, i) => {
    			element.style.cssText = generateTouchPosCss(_as * i - pos_axis, true);
    		});

    		$$invalidate(8, active_item = activeIndicator);
    		$$invalidate(7, defaultIndex = active_item);
    		eventDelegate("remove");
    	}

    	function changeItem(item) {
    		let max = availableSpace;
    		availableDistance = max * item;
    		$$invalidate(1, activeIndicator = item);
    		onEnd();
    	}

    	function changeView() {
    		changeItem(played);
    		played = played < total_elements - 1 ? ++played : 0;
    	}

    	function goTo(step) {
    		let item = Math.max(0, Math.min(step, indicators.length - 1));
    		changeItem(item);
    	}

    	function prevItem() {
    		let step = activeIndicator - 1;
    		goTo(step);
    	}

    	function nextItem() {
    		let step = activeIndicator + 1;
    		goTo(step);
    	}

    	const writable_props = [
    		"transitionDuration",
    		"showIndicators",
    		"autoplay",
    		"delay",
    		"defaultIndex",
    		"active_item",
    		"is_vertical"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Swipe> was created with unknown prop '${key}'`);
    	});

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			swipeWrapper = $$value;
    			$$invalidate(3, swipeWrapper);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			swipeHandler = $$value;
    			$$invalidate(4, swipeHandler);
    		});
    	}

    	const click_handler = i => {
    		changeItem(i);
    	};

    	$$self.$$set = $$props => {
    		if ("transitionDuration" in $$props) $$invalidate(9, transitionDuration = $$props.transitionDuration);
    		if ("showIndicators" in $$props) $$invalidate(0, showIndicators = $$props.showIndicators);
    		if ("autoplay" in $$props) $$invalidate(10, autoplay = $$props.autoplay);
    		if ("delay" in $$props) $$invalidate(11, delay = $$props.delay);
    		if ("defaultIndex" in $$props) $$invalidate(7, defaultIndex = $$props.defaultIndex);
    		if ("active_item" in $$props) $$invalidate(8, active_item = $$props.active_item);
    		if ("is_vertical" in $$props) $$invalidate(12, is_vertical = $$props.is_vertical);
    		if ("$$scope" in $$props) $$invalidate(18, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		transitionDuration,
    		showIndicators,
    		autoplay,
    		delay,
    		defaultIndex,
    		active_item,
    		is_vertical,
    		activeIndicator,
    		indicators,
    		total_elements,
    		availableSpace,
    		availableWidth,
    		swipeElements,
    		availableDistance,
    		swipeWrapper,
    		swipeHandler,
    		pos_axis,
    		page_axis,
    		axis,
    		longTouch,
    		last_axis_pos,
    		played,
    		run_interval,
    		init,
    		update,
    		eventDelegate,
    		normalizeEventBehavior,
    		generateTranslateValue,
    		generateTouchPosCss,
    		touch_active,
    		onMove,
    		onMoveStart,
    		onEnd,
    		changeItem,
    		changeView,
    		goTo,
    		prevItem,
    		nextItem
    	});

    	$$self.$inject_state = $$props => {
    		if ("transitionDuration" in $$props) $$invalidate(9, transitionDuration = $$props.transitionDuration);
    		if ("showIndicators" in $$props) $$invalidate(0, showIndicators = $$props.showIndicators);
    		if ("autoplay" in $$props) $$invalidate(10, autoplay = $$props.autoplay);
    		if ("delay" in $$props) $$invalidate(11, delay = $$props.delay);
    		if ("defaultIndex" in $$props) $$invalidate(7, defaultIndex = $$props.defaultIndex);
    		if ("active_item" in $$props) $$invalidate(8, active_item = $$props.active_item);
    		if ("is_vertical" in $$props) $$invalidate(12, is_vertical = $$props.is_vertical);
    		if ("activeIndicator" in $$props) $$invalidate(1, activeIndicator = $$props.activeIndicator);
    		if ("indicators" in $$props) $$invalidate(2, indicators = $$props.indicators);
    		if ("total_elements" in $$props) $$invalidate(16, total_elements = $$props.total_elements);
    		if ("availableSpace" in $$props) availableSpace = $$props.availableSpace;
    		if ("availableWidth" in $$props) availableWidth = $$props.availableWidth;
    		if ("swipeElements" in $$props) swipeElements = $$props.swipeElements;
    		if ("availableDistance" in $$props) availableDistance = $$props.availableDistance;
    		if ("swipeWrapper" in $$props) $$invalidate(3, swipeWrapper = $$props.swipeWrapper);
    		if ("swipeHandler" in $$props) $$invalidate(4, swipeHandler = $$props.swipeHandler);
    		if ("pos_axis" in $$props) pos_axis = $$props.pos_axis;
    		if ("page_axis" in $$props) page_axis = $$props.page_axis;
    		if ("axis" in $$props) axis = $$props.axis;
    		if ("longTouch" in $$props) longTouch = $$props.longTouch;
    		if ("last_axis_pos" in $$props) last_axis_pos = $$props.last_axis_pos;
    		if ("played" in $$props) played = $$props.played;
    		if ("run_interval" in $$props) $$invalidate(17, run_interval = $$props.run_interval);
    		if ("touch_active" in $$props) touch_active = $$props.touch_active;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*total_elements*/ 65536) {
    			 $$invalidate(2, indicators = Array(total_elements));
    		}

    		if ($$self.$$.dirty[0] & /*autoplay, run_interval, delay*/ 134144) {
    			 {
    				if (autoplay && !run_interval) {
    					$$invalidate(17, run_interval = setInterval(changeView, delay));
    				}

    				if (!autoplay && run_interval) {
    					clearInterval(run_interval);
    					$$invalidate(17, run_interval = false);
    				}
    			}
    		}
    	};

    	return [
    		showIndicators,
    		activeIndicator,
    		indicators,
    		swipeWrapper,
    		swipeHandler,
    		onMoveStart,
    		changeItem,
    		defaultIndex,
    		active_item,
    		transitionDuration,
    		autoplay,
    		delay,
    		is_vertical,
    		goTo,
    		prevItem,
    		nextItem,
    		total_elements,
    		run_interval,
    		$$scope,
    		slots,
    		div2_binding,
    		div3_binding,
    		click_handler
    	];
    }

    class Swipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				transitionDuration: 9,
    				showIndicators: 0,
    				autoplay: 10,
    				delay: 11,
    				defaultIndex: 7,
    				active_item: 8,
    				is_vertical: 12,
    				goTo: 13,
    				prevItem: 14,
    				nextItem: 15
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Swipe",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get transitionDuration() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showIndicators() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showIndicators(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoplay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoplay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultIndex() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultIndex(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active_item() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active_item(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_vertical() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_vertical(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get goTo() {
    		return this.$$.ctx[13];
    	}

    	set goTo(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prevItem() {
    		return this.$$.ctx[14];
    	}

    	set prevItem(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nextItem() {
    		return this.$$.ctx[15];
    	}

    	set nextItem(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-swipe/src/SwipeItem.svelte generated by Svelte v3.31.0 */

    const file$3 = "node_modules/svelte-swipe/src/SwipeItem.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "swipeable-item " + /*classes*/ ctx[0] + " svelte-1ks2opm");
    			add_location(div, file$3, 15, 0, 224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*classes*/ 1 && div_class_value !== (div_class_value = "swipeable-item " + /*classes*/ ctx[0] + " svelte-1ks2opm")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SwipeItem", slots, ['default']);
    	let { classes = "" } = $$props;
    	const writable_props = ["classes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SwipeItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("classes" in $$props) $$invalidate(0, classes = $$props.classes);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classes });

    	$$self.$inject_state = $$props => {
    		if ("classes" in $$props) $$invalidate(0, classes = $$props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [classes, $$scope, slots];
    }

    class SwipeItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { classes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SwipeItem",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get classes() {
    		throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var words = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.WORDS = void 0;
    var WORDS = ["ad", "adipisicing", "aliqua", "aliquip", "amet", "anim", "aute", "cillum", "commodo", "consectetur", "consequat", "culpa", "cupidatat", "deserunt", "do", "dolor", "dolore", "duis", "ea", "eiusmod", "elit", "enim", "esse", "est", "et", "eu", "ex", "excepteur", "exercitation", "fugiat", "id", "in", "incididunt", "ipsum", "irure", "labore", "laboris", "laborum", "Lorem", "magna", "minim", "mollit", "nisi", "non", "nostrud", "nulla", "occaecat", "officia", "pariatur", "proident", "qui", "quis", "reprehenderit", "sint", "sit", "sunt", "tempor", "ullamco", "ut", "velit", "veniam", "voluptate"];
    exports.WORDS = WORDS;

    });

    var formats = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FORMATS = exports.FORMAT_PLAIN = exports.FORMAT_HTML = void 0;
    var FORMAT_HTML = "html";
    exports.FORMAT_HTML = FORMAT_HTML;
    var FORMAT_PLAIN = "plain";
    exports.FORMAT_PLAIN = FORMAT_PLAIN;
    var FORMATS = [FORMAT_HTML, FORMAT_PLAIN];
    exports.FORMATS = FORMATS;

    });

    var lineEndings = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.LINE_ENDINGS = void 0;
    var LINE_ENDINGS = {
      POSIX: "\n",
      WIN32: "\r\n"
    };
    exports.LINE_ENDINGS = LINE_ENDINGS;

    });

    var capitalize_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;

    /**
     * @param str  A string that may or may not be capitalized.
     * @returns    A capitalized string.
     */
    var capitalize = function capitalize(str) {
      var trimmed = str.trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    };

    var _default = capitalize;
    exports.default = _default;

    });

    var isNode_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;

    /**
     * @returns  True if the runtime is NodeJS.
     */
    var isNode = function isNode() {
      return  !!module.exports;
    };

    var _default = isNode;
    exports.default = _default;

    });

    var isReactNative_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;

    /**
     * @returns  True if runtime is ReactNative.
     */
    var isReactNative = function isReactNative() {
      return typeof navigator !== "undefined" && navigator.product === "ReactNative";
    };

    var _default = isReactNative;
    exports.default = _default;

    });

    var platforms = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SUPPORTED_PLATFORMS = void 0;
    var SUPPORTED_PLATFORMS = {
      DARWIN: "darwin",
      LINUX: "linux",
      WIN32: "win32"
    };
    exports.SUPPORTED_PLATFORMS = SUPPORTED_PLATFORMS;

    });

    var isWindows_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;



    /**
     * @returns True if process is windows.
     */
    var isWindows = function isWindows() {
      return typeof process !== "undefined" && process.platform === platforms.SUPPORTED_PLATFORMS.WIN32;
    };

    var _default = isWindows;
    exports.default = _default;

    });

    var makeArrayOfLength_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;

    /**
     * @param length Length "x".
     * @returns      An array of indexes of length "x".
     */
    var makeArrayOfLength = function makeArrayOfLength() {
      var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      return Array.apply(null, Array(length)).map(function (item, index) {
        return index;
      });
    };

    var _default = makeArrayOfLength;
    exports.default = _default;

    });

    var makeArrayOfStrings_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;



    /**
     * @param length  Length "x".
     * @returns       An array of strings of length "x".
     */
    var makeArrayOfStrings = function makeArrayOfStrings(length, makeString) {
      var arr = (0, util.makeArrayOfLength)(length);
      return arr.map(function () {
        return makeString();
      });
    };

    var _default = makeArrayOfStrings;
    exports.default = _default;

    });

    var util = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "capitalize", {
      enumerable: true,
      get: function get() {
        return _capitalize.default;
      }
    });
    Object.defineProperty(exports, "isNode", {
      enumerable: true,
      get: function get() {
        return _isNode.default;
      }
    });
    Object.defineProperty(exports, "isReactNative", {
      enumerable: true,
      get: function get() {
        return _isReactNative.default;
      }
    });
    Object.defineProperty(exports, "isWindows", {
      enumerable: true,
      get: function get() {
        return _isWindows.default;
      }
    });
    Object.defineProperty(exports, "makeArrayOfLength", {
      enumerable: true,
      get: function get() {
        return _makeArrayOfLength.default;
      }
    });
    Object.defineProperty(exports, "makeArrayOfStrings", {
      enumerable: true,
      get: function get() {
        return _makeArrayOfStrings.default;
      }
    });

    var _capitalize = _interopRequireDefault(capitalize_1);

    var _isNode = _interopRequireDefault(isNode_1);

    var _isReactNative = _interopRequireDefault(isReactNative_1);

    var _isWindows = _interopRequireDefault(isWindows_1);

    var _makeArrayOfLength = _interopRequireDefault(makeArrayOfLength_1);

    var _makeArrayOfStrings = _interopRequireDefault(makeArrayOfStrings_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    });

    var generator = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;





    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    var Generator =
    /*#__PURE__*/
    function () {
      function Generator() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$sentencesPerPara = _ref.sentencesPerParagraph,
            sentencesPerParagraph = _ref$sentencesPerPara === void 0 ? {
          max: 7,
          min: 3
        } : _ref$sentencesPerPara,
            _ref$wordsPerSentence = _ref.wordsPerSentence,
            wordsPerSentence = _ref$wordsPerSentence === void 0 ? {
          max: 15,
          min: 5
        } : _ref$wordsPerSentence,
            random = _ref.random,
            seed = _ref.seed,
            _ref$words = _ref.words,
            words$1 = _ref$words === void 0 ? words.WORDS : _ref$words;

        _classCallCheck(this, Generator);

        _defineProperty(this, "sentencesPerParagraph", void 0);

        _defineProperty(this, "wordsPerSentence", void 0);

        _defineProperty(this, "random", void 0);

        _defineProperty(this, "words", void 0);

        if (sentencesPerParagraph.min > sentencesPerParagraph.max) {
          throw new Error("Minimum number of sentences per paragraph (".concat(sentencesPerParagraph.min, ") cannot exceed maximum (").concat(sentencesPerParagraph.max, ")."));
        }

        if (wordsPerSentence.min > wordsPerSentence.max) {
          throw new Error("Minimum number of words per sentence (".concat(wordsPerSentence.min, ") cannot exceed maximum (").concat(wordsPerSentence.max, ")."));
        }

        this.sentencesPerParagraph = sentencesPerParagraph;
        this.words = words$1;
        this.wordsPerSentence = wordsPerSentence;
        this.random = random || Math.random;
      }

      _createClass(Generator, [{
        key: "generateRandomInteger",
        value: function generateRandomInteger(min, max) {
          return Math.floor(this.random() * (max - min + 1) + min);
        }
      }, {
        key: "generateRandomWords",
        value: function generateRandomWords(num) {
          var _this = this;

          var _this$wordsPerSentenc = this.wordsPerSentence,
              min = _this$wordsPerSentenc.min,
              max = _this$wordsPerSentenc.max;
          var length = num || this.generateRandomInteger(min, max);
          return (0, util.makeArrayOfLength)(length).reduce(function (accumulator, index) {
            return "".concat(_this.pluckRandomWord(), " ").concat(accumulator);
          }, "").trim();
        }
      }, {
        key: "generateRandomSentence",
        value: function generateRandomSentence(num) {
          return "".concat((0, util.capitalize)(this.generateRandomWords(num)), ".");
        }
      }, {
        key: "generateRandomParagraph",
        value: function generateRandomParagraph(num) {
          var _this2 = this;

          var _this$sentencesPerPar = this.sentencesPerParagraph,
              min = _this$sentencesPerPar.min,
              max = _this$sentencesPerPar.max;
          var length = num || this.generateRandomInteger(min, max);
          return (0, util.makeArrayOfLength)(length).reduce(function (accumulator, index) {
            return "".concat(_this2.generateRandomSentence(), " ").concat(accumulator);
          }, "").trim();
        }
      }, {
        key: "pluckRandomWord",
        value: function pluckRandomWord() {
          var min = 0;
          var max = this.words.length - 1;
          var index = this.generateRandomInteger(min, max);
          return this.words[index];
        }
      }]);

      return Generator;
    }();

    var _default = Generator;
    exports.default = _default;

    });

    var LoremIpsum_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;





    var _generator = _interopRequireDefault(generator);



    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    var LoremIpsum =
    /*#__PURE__*/
    function () {
      function LoremIpsum() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : formats.FORMAT_PLAIN;
        var suffix = arguments.length > 2 ? arguments[2] : undefined;

        _classCallCheck(this, LoremIpsum);

        _defineProperty(this, "generator", void 0);

        _defineProperty(this, "format", void 0);

        _defineProperty(this, "suffix", void 0);

        if (formats.FORMATS.indexOf(format.toLowerCase()) === -1) {
          throw new Error("".concat(format, " is an invalid format. Please use ").concat(formats.FORMATS.join(" or "), "."));
        }

        this.format = format.toLowerCase();
        this.suffix = suffix;
        this.generator = new _generator.default(options);
      }

      _createClass(LoremIpsum, [{
        key: "getLineEnding",
        value: function getLineEnding() {
          if (this.suffix) {
            return this.suffix;
          }

          if (!(0, util.isReactNative)() && (0, util.isNode)() && (0, util.isWindows)()) {
            return lineEndings.LINE_ENDINGS.WIN32;
          }

          return lineEndings.LINE_ENDINGS.POSIX;
        }
      }, {
        key: "formatString",
        value: function formatString(str) {
          if (this.format === formats.FORMAT_HTML) {
            return "<p>".concat(str, "</p>");
          }

          return str;
        }
      }, {
        key: "formatStrings",
        value: function formatStrings(strings) {
          var _this = this;

          return strings.map(function (str) {
            return _this.formatString(str);
          });
        }
      }, {
        key: "generateWords",
        value: function generateWords(num) {
          return this.formatString(this.generator.generateRandomWords(num));
        }
      }, {
        key: "generateSentences",
        value: function generateSentences(num) {
          return this.formatString(this.generator.generateRandomParagraph(num));
        }
      }, {
        key: "generateParagraphs",
        value: function generateParagraphs(num) {
          var makeString = this.generator.generateRandomParagraph.bind(this.generator);
          return this.formatStrings((0, util.makeArrayOfStrings)(num, makeString)).join(this.getLineEnding());
        }
      }]);

      return LoremIpsum;
    }();

    var _default = LoremIpsum;
    exports.default = _default;

    });

    var dist = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "LoremIpsum", {
      enumerable: true,
      get: function get() {
        return _LoremIpsum.default;
      }
    });
    exports.loremIpsum = void 0;



    var _LoremIpsum = _interopRequireDefault(LoremIpsum_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var loremIpsum = function loremIpsum() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$count = _ref.count,
          count = _ref$count === void 0 ? 1 : _ref$count,
          _ref$format = _ref.format,
          format = _ref$format === void 0 ? "plain" : _ref$format,
          _ref$paragraphLowerBo = _ref.paragraphLowerBound,
          paragraphLowerBound = _ref$paragraphLowerBo === void 0 ? 3 : _ref$paragraphLowerBo,
          _ref$paragraphUpperBo = _ref.paragraphUpperBound,
          paragraphUpperBound = _ref$paragraphUpperBo === void 0 ? 7 : _ref$paragraphUpperBo,
          random = _ref.random,
          _ref$sentenceLowerBou = _ref.sentenceLowerBound,
          sentenceLowerBound = _ref$sentenceLowerBou === void 0 ? 5 : _ref$sentenceLowerBou,
          _ref$sentenceUpperBou = _ref.sentenceUpperBound,
          sentenceUpperBound = _ref$sentenceUpperBou === void 0 ? 15 : _ref$sentenceUpperBou,
          _ref$units = _ref.units,
          units = _ref$units === void 0 ? "sentences" : _ref$units,
          _ref$words = _ref.words,
          words$1 = _ref$words === void 0 ? words.WORDS : _ref$words,
          _ref$suffix = _ref.suffix,
          suffix = _ref$suffix === void 0 ? "" : _ref$suffix;

      var options = {
        random: random,
        sentencesPerParagraph: {
          max: paragraphUpperBound,
          min: paragraphLowerBound
        },
        words: words$1,
        wordsPerSentence: {
          max: sentenceUpperBound,
          min: sentenceLowerBound
        }
      };
      var lorem = new _LoremIpsum.default(options, format, suffix);

      switch (units) {
        case "paragraphs":
        case "paragraph":
          return lorem.generateParagraphs(count);

        case "sentences":
        case "sentence":
          return lorem.generateSentences(count);

        case "words":
        case "word":
          return lorem.generateWords(count);

        default:
          return "";
      }
    };

    exports.loremIpsum = loremIpsum;

    });

    /* src/Conversation.svelte generated by Svelte v3.31.0 */
    const file$4 = "src/Conversation.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (42:0) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t0;
    	let swipe;
    	let t1;
    	let current;
    	let if_block0 = /*messages*/ ctx[1][/*focus*/ ctx[0]].before.length > 0 && create_if_block_2(ctx);
    	const swipe_spread_levels = [/*swipeConfig*/ ctx[2]];

    	let swipe_props = {
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < swipe_spread_levels.length; i += 1) {
    		swipe_props = assign(swipe_props, swipe_spread_levels[i]);
    	}

    	swipe = new Swipe({ props: swipe_props, $$inline: true });
    	let if_block1 = /*messages*/ ctx[1][/*focus*/ ctx[0]].after.length > 0 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			create_component(swipe.$$.fragment);
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "swipe-holder svelte-10qil5v");
    			add_location(div, file$4, 44, 0, 774);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			mount_component(swipe, div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*messages*/ ctx[1][/*focus*/ ctx[0]].before.length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*messages, focus*/ 3) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const swipe_changes = (dirty & /*swipeConfig*/ 4)
    			? get_spread_update(swipe_spread_levels, [get_spread_object(/*swipeConfig*/ ctx[2])])
    			: {};

    			if (dirty & /*$$scope, messages, focus*/ 515) {
    				swipe_changes.$$scope = { dirty, ctx };
    			}

    			swipe.$set(swipe_changes);

    			if (/*messages*/ ctx[1][/*focus*/ ctx[0]].after.length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*messages, focus*/ 3) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(swipe.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(swipe.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			destroy_component(swipe);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(42:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:0) {#if focus===null}
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Nothing yet! Add random message to get started :)";
    			add_location(p, file$4, 40, 4, 707);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(40:0) {#if focus===null}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#if messages[focus].before.length > 0}
    function create_if_block_2(ctx) {
    	let swipe;
    	let current;
    	const swipe_spread_levels = [/*swipeConfig*/ ctx[2]];

    	let swipe_props = {
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < swipe_spread_levels.length; i += 1) {
    		swipe_props = assign(swipe_props, swipe_spread_levels[i]);
    	}

    	swipe = new Swipe({ props: swipe_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(swipe.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(swipe, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const swipe_changes = (dirty & /*swipeConfig*/ 4)
    			? get_spread_update(swipe_spread_levels, [get_spread_object(/*swipeConfig*/ ctx[2])])
    			: {};

    			if (dirty & /*$$scope, messages, focus*/ 515) {
    				swipe_changes.$$scope = { dirty, ctx };
    			}

    			swipe.$set(swipe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(swipe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(swipe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(47:4) {#if messages[focus].before.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (50:8) <SwipeItem>
    function create_default_slot_5(ctx) {
    	let message;
    	let t;
    	let current;

    	message = new Message({
    			props: {
    				body: /*messages*/ ctx[1][/*bef*/ ctx[7]].body,
    				index: /*i*/ ctx[6] + 1,
    				index_limit: /*messages*/ ctx[1][/*focus*/ ctx[0]].before.length,
    				id: /*bef*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(message.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(message, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const message_changes = {};
    			if (dirty & /*messages, focus*/ 3) message_changes.body = /*messages*/ ctx[1][/*bef*/ ctx[7]].body;
    			if (dirty & /*messages, focus*/ 3) message_changes.index_limit = /*messages*/ ctx[1][/*focus*/ ctx[0]].before.length;
    			if (dirty & /*messages, focus*/ 3) message_changes.id = /*bef*/ ctx[7];
    			message.$set(message_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(message.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(message.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(message, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(50:8) <SwipeItem>",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#each messages[focus].before as bef, i}
    function create_each_block_1(ctx) {
    	let swipeitem;
    	let current;

    	swipeitem = new SwipeItem({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(swipeitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(swipeitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const swipeitem_changes = {};

    			if (dirty & /*$$scope, messages, focus*/ 515) {
    				swipeitem_changes.$$scope = { dirty, ctx };
    			}

    			swipeitem.$set(swipeitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(swipeitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(swipeitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(49:4) {#each messages[focus].before as bef, i}",
    		ctx
    	});

    	return block;
    }

    // (48:4) <Swipe {...swipeConfig}>
    function create_default_slot_4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*messages*/ ctx[1][/*focus*/ ctx[0]].before;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*messages, focus*/ 3) {
    				each_value_1 = /*messages*/ ctx[1][/*focus*/ ctx[0]].before;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(48:4) <Swipe {...swipeConfig}>",
    		ctx
    	});

    	return block;
    }

    // (72:8) <SwipeItem>
    function create_default_slot_3(ctx) {
    	let message;
    	let current;

    	message = new Message({
    			props: {
    				body: /*messages*/ ctx[1][/*focus*/ ctx[0]].body,
    				id: /*focus*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(message.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(message, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const message_changes = {};
    			if (dirty & /*messages, focus*/ 3) message_changes.body = /*messages*/ ctx[1][/*focus*/ ctx[0]].body;
    			if (dirty & /*focus*/ 1) message_changes.id = /*focus*/ ctx[0];
    			message.$set(message_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(message.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(message.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(message, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(72:8) <SwipeItem>",
    		ctx
    	});

    	return block;
    }

    // (71:4) <Swipe {...swipeConfig}>
    function create_default_slot_2(ctx) {
    	let swipeitem;
    	let current;

    	swipeitem = new SwipeItem({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(swipeitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(swipeitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const swipeitem_changes = {};

    			if (dirty & /*$$scope, messages, focus*/ 515) {
    				swipeitem_changes.$$scope = { dirty, ctx };
    			}

    			swipeitem.$set(swipeitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(swipeitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(swipeitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(71:4) <Swipe {...swipeConfig}>",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if messages[focus].after.length > 0}
    function create_if_block_1(ctx) {
    	let swipe;
    	let current;
    	const swipe_spread_levels = [/*swipeConfig*/ ctx[2]];

    	let swipe_props = {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < swipe_spread_levels.length; i += 1) {
    		swipe_props = assign(swipe_props, swipe_spread_levels[i]);
    	}

    	swipe = new Swipe({ props: swipe_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(swipe.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(swipe, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const swipe_changes = (dirty & /*swipeConfig*/ 4)
    			? get_spread_update(swipe_spread_levels, [get_spread_object(/*swipeConfig*/ ctx[2])])
    			: {};

    			if (dirty & /*$$scope, messages, focus*/ 515) {
    				swipe_changes.$$scope = { dirty, ctx };
    			}

    			swipe.$set(swipe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(swipe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(swipe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:4) {#if messages[focus].after.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (84:8) <SwipeItem>
    function create_default_slot_1(ctx) {
    	let message;
    	let t;
    	let current;

    	message = new Message({
    			props: {
    				body: /*messages*/ ctx[1][/*aft*/ ctx[4]].body,
    				index: /*i*/ ctx[6] + 1,
    				index_limit: /*messages*/ ctx[1][/*focus*/ ctx[0]].after.length,
    				id: /*aft*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(message.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(message, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const message_changes = {};
    			if (dirty & /*messages, focus*/ 3) message_changes.body = /*messages*/ ctx[1][/*aft*/ ctx[4]].body;
    			if (dirty & /*messages, focus*/ 3) message_changes.index_limit = /*messages*/ ctx[1][/*focus*/ ctx[0]].after.length;
    			if (dirty & /*messages, focus*/ 3) message_changes.id = /*aft*/ ctx[4];
    			message.$set(message_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(message.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(message.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(message, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(84:8) <SwipeItem>",
    		ctx
    	});

    	return block;
    }

    // (83:4) {#each messages[focus].after as aft, i}
    function create_each_block$1(ctx) {
    	let swipeitem;
    	let current;

    	swipeitem = new SwipeItem({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(swipeitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(swipeitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const swipeitem_changes = {};

    			if (dirty & /*$$scope, messages, focus*/ 515) {
    				swipeitem_changes.$$scope = { dirty, ctx };
    			}

    			swipeitem.$set(swipeitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(swipeitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(swipeitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(83:4) {#each messages[focus].after as aft, i}",
    		ctx
    	});

    	return block;
    }

    // (82:4) <Swipe {...swipeConfig}>
    function create_default_slot$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*messages*/ ctx[1][/*focus*/ ctx[0]].after;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*messages, focus*/ 3) {
    				each_value = /*messages*/ ctx[1][/*focus*/ ctx[0]].after;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(82:4) <Swipe {...swipeConfig}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*focus*/ ctx[0] === null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Conversation", slots, []);
    	let { focus } = $$props;
    	let { messages } = $$props;

    	const lorem = new dist.LoremIpsum({
    			sentencesPerParagraph: { max: 8, min: 4 },
    			wordsPerSentence: { max: 16, min: 4 }
    		});

    	const swipeConfig = {
    		autoplay: false,
    		delay: 2000,
    		showIndicators: false,
    		transitionDuration: 100,
    		defaultIndex: 0
    	};

    	const writable_props = ["focus", "messages"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Conversation> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("focus" in $$props) $$invalidate(0, focus = $$props.focus);
    		if ("messages" in $$props) $$invalidate(1, messages = $$props.messages);
    	};

    	$$self.$capture_state = () => ({
    		Message,
    		Swipe,
    		SwipeItem,
    		LoremIpsum: dist.LoremIpsum,
    		focus,
    		messages,
    		lorem,
    		swipeConfig
    	});

    	$$self.$inject_state = $$props => {
    		if ("focus" in $$props) $$invalidate(0, focus = $$props.focus);
    		if ("messages" in $$props) $$invalidate(1, messages = $$props.messages);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [focus, messages, swipeConfig];
    }

    class Conversation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { focus: 0, messages: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Conversation",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*focus*/ ctx[0] === undefined && !("focus" in props)) {
    			console.warn("<Conversation> was created without expected prop 'focus'");
    		}

    		if (/*messages*/ ctx[1] === undefined && !("messages" in props)) {
    			console.warn("<Conversation> was created without expected prop 'messages'");
    		}
    	}

    	get focus() {
    		throw new Error("<Conversation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focus(value) {
    		throw new Error("<Conversation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get messages() {
    		throw new Error("<Conversation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set messages(value) {
    		throw new Error("<Conversation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var visData_min = createCommonjsModule(function (module, exports) {
    /**
     * vis-data
     * http://visjs.org/
     *
     * Manage unstructured data using DataSet. Add, update, and remove data, and listen for changes in the data.
     *
     * @version 7.1.1
     * @date    2020-11-15T19:08:22.864Z
     *
     * @copyright (c) 2011-2017 Almende B.V, http://almende.com
     * @copyright (c) 2017-2019 visjs contributors, https://github.com/visjs
     *
     * @license
     * vis.js is dual licensed under both
     *
     *   1. The Apache 2.0 License
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     *   and
     *
     *   2. The MIT License
     *      http://opensource.org/licenses/MIT
     *
     * vis.js may be distributed under either license.
     */
    !function(t,e){e(exports);}(commonjsGlobal,(function(t){var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof commonjsGlobal?commonjsGlobal:"undefined"!=typeof self?self:{};function r(t,e,r){return t(r={path:e,exports:{},require:function(t,e){return function(){throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs")}(null==e&&r.path)}},r.exports),r.exports}var n=function(t){return t&&t.Math==Math&&t},o=n("object"==typeof globalThis&&globalThis)||n("object"==typeof window&&window)||n("object"==typeof self&&self)||n("object"==typeof e&&e)||function(){return this}()||Function("return this")(),i=function(t){try{return !!t()}catch(t){return !0}},a=!i((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]})),u={}.propertyIsEnumerable,c=Object.getOwnPropertyDescriptor,s={f:c&&!u.call({1:2},1)?function(t){var e=c(this,t);return !!e&&e.enumerable}:u},f=function(t,e){return {enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}},l={}.toString,h=function(t){return l.call(t).slice(8,-1)},p="".split,v=i((function(){return !Object("z").propertyIsEnumerable(0)}))?function(t){return "String"==h(t)?p.call(t,""):Object(t)}:Object,d=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t},y=function(t){return v(d(t))},g=function(t){return "object"==typeof t?null!==t:"function"==typeof t},m=function(t,e){if(!g(t))return t;var r,n;if(e&&"function"==typeof(r=t.toString)&&!g(n=r.call(t)))return n;if("function"==typeof(r=t.valueOf)&&!g(n=r.call(t)))return n;if(!e&&"function"==typeof(r=t.toString)&&!g(n=r.call(t)))return n;throw TypeError("Can't convert object to primitive value")},b={}.hasOwnProperty,_=function(t,e){return b.call(t,e)},w=o.document,O=g(w)&&g(w.createElement),x=function(t){return O?w.createElement(t):{}},S=!a&&!i((function(){return 7!=Object.defineProperty(x("div"),"a",{get:function(){return 7}}).a})),k=Object.getOwnPropertyDescriptor,j={f:a?k:function(t,e){if(t=y(t),e=m(e,!0),S)try{return k(t,e)}catch(t){}if(_(t,e))return f(!s.f.call(t,e),t[e])}},A=/#|\.prototype\./,E=function(t,e){var r=I[P(t)];return r==D||r!=T&&("function"==typeof e?i(e):!!e)},P=E.normalize=function(t){return String(t).replace(A,".").toLowerCase()},I=E.data={},T=E.NATIVE="N",D=E.POLYFILL="P",L=E,C={},R=function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function");return t},M=function(t,e,r){if(R(t),void 0===e)return t;switch(r){case 0:return function(){return t.call(e)};case 1:return function(r){return t.call(e,r)};case 2:return function(r,n){return t.call(e,r,n)};case 3:return function(r,n,o){return t.call(e,r,n,o)}}return function(){return t.apply(e,arguments)}},F=function(t){if(!g(t))throw TypeError(String(t)+" is not an object");return t},N=Object.defineProperty,q={f:a?N:function(t,e,r){if(F(t),e=m(e,!0),F(r),S)try{return N(t,e,r)}catch(t){}if("get"in r||"set"in r)throw TypeError("Accessors not supported");return "value"in r&&(t[e]=r.value),t}},G=a?function(t,e,r){return q.f(t,e,f(1,r))}:function(t,e,r){return t[e]=r,t},z=j.f,U=function(t){var e=function(e,r,n){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,r)}return new t(e,r,n)}return t.apply(this,arguments)};return e.prototype=t.prototype,e},V=function(t,e){var r,n,i,a,u,c,s,f,l=t.target,h=t.global,p=t.stat,v=t.proto,d=h?o:p?o[l]:(o[l]||{}).prototype,y=h?C:C[l]||(C[l]={}),g=y.prototype;for(i in e)r=!L(h?i:l+(p?".":"#")+i,t.forced)&&d&&_(d,i),u=y[i],r&&(c=t.noTargetGet?(f=z(d,i))&&f.value:d[i]),a=r&&c?c:e[i],r&&typeof u==typeof a||(s=t.bind&&r?M(a,o):t.wrap&&r?U(a):v&&"function"==typeof a?M(Function.call,a):a,(t.sham||a&&a.sham||u&&u.sham)&&G(s,"sham",!0),y[i]=s,v&&(_(C,n=l+"Prototype")||G(C,n,{}),C[n][i]=a,t.real&&g&&!g[i]&&G(g,i,a)));},J=Array.isArray||function(t){return "Array"==h(t)},$=Math.ceil,W=Math.floor,B=function(t){return isNaN(t=+t)?0:(t>0?W:$)(t)},K=Math.min,Q=function(t){return t>0?K(B(t),9007199254740991):0},Y=function(t,e,r,n,o,i,a,u){for(var c,s=o,f=0,l=!!a&&M(a,u,3);f<n;){if(f in r){if(c=l?l(r[f],f,e):r[f],i>0&&J(c))s=Y(t,e,c,Q(c.length),s,i-1)-1;else {if(s>=9007199254740991)throw TypeError("Exceed the acceptable array length");t[s]=c;}s++;}f++;}return s},H=Y,X=function(t){return Object(d(t))},Z="__core-js_shared__",tt=o[Z]||function(t,e){try{G(o,t,e);}catch(r){o[t]=e;}return e}(Z,{}),et=r((function(t){(t.exports=function(t,e){return tt[t]||(tt[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.7.0",mode:"pure",copyright:"© 2020 Denis Pushkarev (zloirock.ru)"});})),rt=0,nt=Math.random(),ot=function(t){return "Symbol("+String(void 0===t?"":t)+")_"+(++rt+nt).toString(36)},it=!!Object.getOwnPropertySymbols&&!i((function(){return !String(Symbol())})),at=it&&!Symbol.sham&&"symbol"==typeof Symbol.iterator,ut=et("wks"),ct=o.Symbol,st=at?ct:ct&&ct.withoutSetter||ot,ft=function(t){return _(ut,t)||(it&&_(ct,t)?ut[t]=ct[t]:ut[t]=st("Symbol."+t)),ut[t]},lt=ft("species"),ht=function(t,e){var r;return J(t)&&("function"!=typeof(r=t.constructor)||r!==Array&&!J(r.prototype)?g(r)&&null===(r=r[lt])&&(r=void 0):r=void 0),new(void 0===r?Array:r)(0===e?0:e)};V({target:"Array",proto:!0},{flatMap:function(t){var e,r=X(this),n=Q(r.length);return R(t),(e=ht(r,0)).length=H(e,r,r,n,0,1,t,arguments.length>1?arguments[1]:void 0),e}});var pt,vt,dt=function(t){return C[t+"Prototype"]},yt=dt("Array").flatMap,gt=Array.prototype,mt=function(t){var e=t.flatMap;return t===gt||t instanceof Array&&e===gt.flatMap?yt:e},bt=[].push,_t=function(t){var e=1==t,r=2==t,n=3==t,o=4==t,i=6==t,a=5==t||i;return function(u,c,s,f){for(var l,h,p=X(u),d=v(p),y=M(c,s,3),g=Q(d.length),m=0,b=f||ht,_=e?b(u,g):r?b(u,0):void 0;g>m;m++)if((a||m in d)&&(h=y(l=d[m],m,p),t))if(e)_[m]=h;else if(h)switch(t){case 3:return !0;case 5:return l;case 6:return m;case 2:bt.call(_,l);}else if(o)return !1;return i?-1:n||o?o:_}},wt={forEach:_t(0),map:_t(1),filter:_t(2),some:_t(3),every:_t(4),find:_t(5),findIndex:_t(6)},Ot=function(t){return "function"==typeof t?t:void 0},xt=function(t,e){return arguments.length<2?Ot(C[t])||Ot(o[t]):C[t]&&C[t][e]||o[t]&&o[t][e]},St=xt("navigator","userAgent")||"",kt=o.process,jt=kt&&kt.versions,At=jt&&jt.v8;At?vt=(pt=At.split("."))[0]+pt[1]:St&&(!(pt=St.match(/Edge\/(\d+)/))||pt[1]>=74)&&(pt=St.match(/Chrome\/(\d+)/))&&(vt=pt[1]);var Et=vt&&+vt,Pt=ft("species"),It=function(t){return Et>=51||!i((function(){var e=[];return (e.constructor={})[Pt]=function(){return {foo:1}},1!==e[t](Boolean).foo}))},Tt=Object.defineProperty,Dt={},Lt=function(t){throw t},Ct=function(t,e){if(_(Dt,t))return Dt[t];e||(e={});var r=[][t],n=!!_(e,"ACCESSORS")&&e.ACCESSORS,o=_(e,0)?e[0]:Lt,u=_(e,1)?e[1]:void 0;return Dt[t]=!!r&&!i((function(){if(n&&!a)return !0;var t={length:-1};n?Tt(t,1,{enumerable:!0,get:Lt}):t[1]=1,r.call(t,o,u);}))},Rt=wt.map,Mt=It("map"),Ft=Ct("map");V({target:"Array",proto:!0,forced:!Mt||!Ft},{map:function(t){return Rt(this,t,arguments.length>1?arguments[1]:void 0)}});var Nt=dt("Array").map,qt=Array.prototype,Gt=function(t){var e=t.map;return t===qt||t instanceof Array&&e===qt.map?Nt:e},zt=wt.filter,Ut=It("filter"),Vt=Ct("filter");V({target:"Array",proto:!0,forced:!Ut||!Vt},{filter:function(t){return zt(this,t,arguments.length>1?arguments[1]:void 0)}});var Jt=dt("Array").filter,$t=Array.prototype,Wt=function(t){var e=t.filter;return t===$t||t instanceof Array&&e===$t.filter?Jt:e},Bt=function(t){return function(e,r,n,o){R(r);var i=X(e),a=v(i),u=Q(i.length),c=t?u-1:0,s=t?-1:1;if(n<2)for(;;){if(c in a){o=a[c],c+=s;break}if(c+=s,t?c<0:u<=c)throw TypeError("Reduce of empty array with no initial value")}for(;t?c>=0:u>c;c+=s)c in a&&(o=r(o,a[c],c,i));return o}},Kt={left:Bt(!1),right:Bt(!0)},Qt=function(t,e){var r=[][t];return !!r&&i((function(){r.call(null,e||function(){throw 1},1);}))},Yt="process"==h(o.process),Ht=Kt.left,Xt=Qt("reduce"),Zt=Ct("reduce",{1:0});V({target:"Array",proto:!0,forced:!Xt||!Zt||!Yt&&Et>79&&Et<83},{reduce:function(t){return Ht(this,t,arguments.length,arguments.length>1?arguments[1]:void 0)}});var te=dt("Array").reduce,ee=Array.prototype,re=function(t){var e=t.reduce;return t===ee||t instanceof Array&&e===ee.reduce?te:e},ne=[].slice,oe={},ie=function(t,e,r){if(!(e in oe)){for(var n=[],o=0;o<e;o++)n[o]="a["+o+"]";oe[e]=Function("C,a","return new C("+n.join(",")+")");}return oe[e](t,r)},ae=Function.bind||function(t){var e=R(this),r=ne.call(arguments,1),n=function(){var o=r.concat(ne.call(arguments));return this instanceof n?ie(e,o.length,o):e.apply(t,o)};return g(e.prototype)&&(n.prototype=e.prototype),n};V({target:"Function",proto:!0},{bind:ae});var ue=dt("Function").bind,ce=Function.prototype,se=function(t){var e=t.bind;return t===ce||t instanceof Function&&e===ce.bind?ue:e};var fe=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")};V({target:"Object",stat:!0,forced:!a,sham:!a},{defineProperty:q.f});var le=r((function(t){var e=C.Object,r=t.exports=function(t,r,n){return e.defineProperty(t,r,n)};e.defineProperty.sham&&(r.sham=!0);})),he=le;function pe(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),he(t,n.key,n);}}var ve=function(t,e,r){return e&&pe(t.prototype,e),r&&pe(t,r),t};var de=function(){function t(e,r,n){var o,i,a;fe(this,t),this._source=e,this._transformers=r,this._target=n,this._listeners={add:se(o=this._add).call(o,this),remove:se(i=this._remove).call(i,this),update:se(a=this._update).call(a,this)};}return ve(t,[{key:"all",value:function(){return this._target.update(this._transformItems(this._source.get())),this}},{key:"start",value:function(){return this._source.on("add",this._listeners.add),this._source.on("remove",this._listeners.remove),this._source.on("update",this._listeners.update),this}},{key:"stop",value:function(){return this._source.off("add",this._listeners.add),this._source.off("remove",this._listeners.remove),this._source.off("update",this._listeners.update),this}},{key:"_transformItems",value:function(t){var e;return re(e=this._transformers).call(e,(function(t,e){return e(t)}),t)}},{key:"_add",value:function(t,e){null!=e&&this._target.add(this._transformItems(this._source.get(e.items)));}},{key:"_update",value:function(t,e){null!=e&&this._target.update(this._transformItems(this._source.get(e.items)));}},{key:"_remove",value:function(t,e){null!=e&&this._target.remove(this._transformItems(e.oldData));}}]),t}(),ye=function(){function t(e){fe(this,t),this._source=e,this._transformers=[];}return ve(t,[{key:"filter",value:function(t){return this._transformers.push((function(e){return Wt(e).call(e,t)})),this}},{key:"map",value:function(t){return this._transformers.push((function(e){return Gt(e).call(e,t)})),this}},{key:"flatMap",value:function(t){return this._transformers.push((function(e){return mt(e).call(e,t)})),this}},{key:"to",value:function(t){return new de(this._source,this._transformers,t)}}]),t}(),ge=le,me=Math.max,be=Math.min,_e=function(t,e){var r=B(t);return r<0?me(r+e,0):be(r,e)},we=function(t){return function(e,r,n){var o,i=y(e),a=Q(i.length),u=_e(n,a);if(t&&r!=r){for(;a>u;)if((o=i[u++])!=o)return !0}else for(;a>u;u++)if((t||u in i)&&i[u]===r)return t||u||0;return !t&&-1}},Oe={includes:we(!0),indexOf:we(!1)},xe={},Se=Oe.indexOf,ke=function(t,e){var r,n=y(t),o=0,i=[];for(r in n)!_(xe,r)&&_(n,r)&&i.push(r);for(;e.length>o;)_(n,r=e[o++])&&(~Se(i,r)||i.push(r));return i},je=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],Ae=Object.keys||function(t){return ke(t,je)},Ee=a?Object.defineProperties:function(t,e){F(t);for(var r,n=Ae(e),o=n.length,i=0;o>i;)q.f(t,r=n[i++],e[r]);return t};V({target:"Object",stat:!0,forced:!a,sham:!a},{defineProperties:Ee});var Pe=r((function(t){var e=C.Object,r=t.exports=function(t,r){return e.defineProperties(t,r)};e.defineProperties.sham&&(r.sham=!0);})),Ie=je.concat("length","prototype"),Te={f:Object.getOwnPropertyNames||function(t){return ke(t,Ie)}},De={f:Object.getOwnPropertySymbols},Le=xt("Reflect","ownKeys")||function(t){var e=Te.f(F(t)),r=De.f;return r?e.concat(r(t)):e},Ce=function(t,e,r){var n=m(e);n in t?q.f(t,n,f(0,r)):t[n]=r;};V({target:"Object",stat:!0,sham:!a},{getOwnPropertyDescriptors:function(t){for(var e,r,n=y(t),o=j.f,i=Le(n),a={},u=0;i.length>u;)void 0!==(r=o(n,e=i[u++]))&&Ce(a,e,r);return a}});var Re=C.Object.getOwnPropertyDescriptors,Me=j.f,Fe=i((function(){Me(1);}));V({target:"Object",stat:!0,forced:!a||Fe,sham:!a},{getOwnPropertyDescriptor:function(t,e){return Me(y(t),e)}});var Ne,qe=r((function(t){var e=C.Object,r=t.exports=function(t,r){return e.getOwnPropertyDescriptor(t,r)};e.getOwnPropertyDescriptor.sham&&(r.sham=!0);})),Ge=xt("document","documentElement"),ze=et("keys"),Ue=function(t){return ze[t]||(ze[t]=ot(t))},Ve=Ue("IE_PROTO"),Je=function(){},$e=function(t){return "<script>"+t+"</"+"script>"},We=function(){try{Ne=document.domain&&new ActiveXObject("htmlfile");}catch(t){}var t,e;We=Ne?function(t){t.write($e("")),t.close();var e=t.parentWindow.Object;return t=null,e}(Ne):((e=x("iframe")).style.display="none",Ge.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write($e("document.F=Object")),t.close(),t.F);for(var r=je.length;r--;)delete We.prototype[je[r]];return We()};xe[Ve]=!0;var Be=Object.create||function(t,e){var r;return null!==t?(Je.prototype=F(t),r=new Je,Je.prototype=null,r[Ve]=t):r=We(),void 0===e?r:Ee(r,e)},Ke=Te.f,Qe={}.toString,Ye="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],He={f:function(t){return Ye&&"[object Window]"==Qe.call(t)?function(t){try{return Ke(t)}catch(t){return Ye.slice()}}(t):Ke(y(t))}},Xe=function(t,e,r,n){n&&n.enumerable?t[e]=r:G(t,e,r);},Ze={f:ft},tr=q.f,er=function(t){var e=C.Symbol||(C.Symbol={});_(e,t)||tr(e,t,{value:Ze.f(t)});},rr={};rr[ft("toStringTag")]="z";var nr="[object z]"===String(rr),or=ft("toStringTag"),ir="Arguments"==h(function(){return arguments}()),ar=nr?h:function(t){var e,r,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(r=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),or))?r:ir?h(e):"Object"==(n=h(e))&&"function"==typeof e.callee?"Arguments":n},ur=nr?{}.toString:function(){return "[object "+ar(this)+"]"},cr=q.f,sr=ft("toStringTag"),fr=function(t,e,r,n){if(t){var o=r?t:t.prototype;_(o,sr)||cr(o,sr,{configurable:!0,value:e}),n&&!nr&&G(o,"toString",ur);}},lr=Function.toString;"function"!=typeof tt.inspectSource&&(tt.inspectSource=function(t){return lr.call(t)});var hr,pr,vr,dr=tt.inspectSource,yr=o.WeakMap,gr="function"==typeof yr&&/native code/.test(dr(yr)),mr=o.WeakMap;if(gr){var br=tt.state||(tt.state=new mr),_r=br.get,wr=br.has,Or=br.set;hr=function(t,e){return e.facade=t,Or.call(br,t,e),e},pr=function(t){return _r.call(br,t)||{}},vr=function(t){return wr.call(br,t)};}else {var xr=Ue("state");xe[xr]=!0,hr=function(t,e){return e.facade=t,G(t,xr,e),e},pr=function(t){return _(t,xr)?t[xr]:{}},vr=function(t){return _(t,xr)};}var Sr={set:hr,get:pr,has:vr,enforce:function(t){return vr(t)?pr(t):hr(t,{})},getterFor:function(t){return function(e){var r;if(!g(e)||(r=pr(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return r}}},kr=wt.forEach,jr=Ue("hidden"),Ar="Symbol",Er=ft("toPrimitive"),Pr=Sr.set,Ir=Sr.getterFor(Ar),Tr=Object.prototype,Dr=o.Symbol,Lr=xt("JSON","stringify"),Cr=j.f,Rr=q.f,Mr=He.f,Fr=s.f,Nr=et("symbols"),qr=et("op-symbols"),Gr=et("string-to-symbol-registry"),zr=et("symbol-to-string-registry"),Ur=et("wks"),Vr=o.QObject,Jr=!Vr||!Vr.prototype||!Vr.prototype.findChild,$r=a&&i((function(){return 7!=Be(Rr({},"a",{get:function(){return Rr(this,"a",{value:7}).a}})).a}))?function(t,e,r){var n=Cr(Tr,e);n&&delete Tr[e],Rr(t,e,r),n&&t!==Tr&&Rr(Tr,e,n);}:Rr,Wr=function(t,e){var r=Nr[t]=Be(Dr.prototype);return Pr(r,{type:Ar,tag:t,description:e}),a||(r.description=e),r},Br=at?function(t){return "symbol"==typeof t}:function(t){return Object(t)instanceof Dr},Kr=function(t,e,r){t===Tr&&Kr(qr,e,r),F(t);var n=m(e,!0);return F(r),_(Nr,n)?(r.enumerable?(_(t,jr)&&t[jr][n]&&(t[jr][n]=!1),r=Be(r,{enumerable:f(0,!1)})):(_(t,jr)||Rr(t,jr,f(1,{})),t[jr][n]=!0),$r(t,n,r)):Rr(t,n,r)},Qr=function(t,e){F(t);var r=y(e),n=Ae(r).concat(Zr(r));return kr(n,(function(e){a&&!Yr.call(r,e)||Kr(t,e,r[e]);})),t},Yr=function(t){var e=m(t,!0),r=Fr.call(this,e);return !(this===Tr&&_(Nr,e)&&!_(qr,e))&&(!(r||!_(this,e)||!_(Nr,e)||_(this,jr)&&this[jr][e])||r)},Hr=function(t,e){var r=y(t),n=m(e,!0);if(r!==Tr||!_(Nr,n)||_(qr,n)){var o=Cr(r,n);return !o||!_(Nr,n)||_(r,jr)&&r[jr][n]||(o.enumerable=!0),o}},Xr=function(t){var e=Mr(y(t)),r=[];return kr(e,(function(t){_(Nr,t)||_(xe,t)||r.push(t);})),r},Zr=function(t){var e=t===Tr,r=Mr(e?qr:y(t)),n=[];return kr(r,(function(t){!_(Nr,t)||e&&!_(Tr,t)||n.push(Nr[t]);})),n};if(it||(Xe((Dr=function(){if(this instanceof Dr)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=ot(t),r=function(t){this===Tr&&r.call(qr,t),_(this,jr)&&_(this[jr],e)&&(this[jr][e]=!1),$r(this,e,f(1,t));};return a&&Jr&&$r(Tr,e,{configurable:!0,set:r}),Wr(e,t)}).prototype,"toString",(function(){return Ir(this).tag})),Xe(Dr,"withoutSetter",(function(t){return Wr(ot(t),t)})),s.f=Yr,q.f=Kr,j.f=Hr,Te.f=He.f=Xr,De.f=Zr,Ze.f=function(t){return Wr(ft(t),t)},a&&Rr(Dr.prototype,"description",{configurable:!0,get:function(){return Ir(this).description}})),V({global:!0,wrap:!0,forced:!it,sham:!it},{Symbol:Dr}),kr(Ae(Ur),(function(t){er(t);})),V({target:Ar,stat:!0,forced:!it},{for:function(t){var e=String(t);if(_(Gr,e))return Gr[e];var r=Dr(e);return Gr[e]=r,zr[r]=e,r},keyFor:function(t){if(!Br(t))throw TypeError(t+" is not a symbol");if(_(zr,t))return zr[t]},useSetter:function(){Jr=!0;},useSimple:function(){Jr=!1;}}),V({target:"Object",stat:!0,forced:!it,sham:!a},{create:function(t,e){return void 0===e?Be(t):Qr(Be(t),e)},defineProperty:Kr,defineProperties:Qr,getOwnPropertyDescriptor:Hr}),V({target:"Object",stat:!0,forced:!it},{getOwnPropertyNames:Xr,getOwnPropertySymbols:Zr}),V({target:"Object",stat:!0,forced:i((function(){De.f(1);}))},{getOwnPropertySymbols:function(t){return De.f(X(t))}}),Lr){var tn=!it||i((function(){var t=Dr();return "[null]"!=Lr([t])||"{}"!=Lr({a:t})||"{}"!=Lr(Object(t))}));V({target:"JSON",stat:!0,forced:tn},{stringify:function(t,e,r){for(var n,o=[t],i=1;arguments.length>i;)o.push(arguments[i++]);if(n=e,(g(e)||void 0!==t)&&!Br(t))return J(e)||(e=function(t,e){if("function"==typeof n&&(e=n.call(this,t,e)),!Br(e))return e}),o[1]=e,Lr.apply(null,o)}});}Dr.prototype[Er]||G(Dr.prototype,Er,Dr.prototype.valueOf),fr(Dr,Ar),xe[jr]=!0;var en,rn,nn,on=C.Object.getOwnPropertySymbols,an={},un=!i((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),cn=Ue("IE_PROTO"),sn=Object.prototype,fn=un?Object.getPrototypeOf:function(t){return t=X(t),_(t,cn)?t[cn]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?sn:null},ln=(ft("iterator"),!1);[].keys&&("next"in(nn=[].keys())?(rn=fn(fn(nn)))!==Object.prototype&&(en=rn):ln=!0),null==en&&(en={});var hn={IteratorPrototype:en,BUGGY_SAFARI_ITERATORS:ln},pn=hn.IteratorPrototype,vn=function(){return this},dn=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,r={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(r,[]),e=r instanceof Array;}catch(t){}return function(r,n){return F(r),function(t){if(!g(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype")}(n),e?t.call(r,n):r.__proto__=n,r}}():void 0),yn=hn.IteratorPrototype,gn=hn.BUGGY_SAFARI_ITERATORS,mn=ft("iterator"),bn="keys",_n="values",wn="entries",On=function(){return this},xn=function(t,e,r,n,o,i,a){!function(t,e,r){var n=e+" Iterator";t.prototype=Be(pn,{next:f(1,r)}),fr(t,n,!1,!0),an[n]=vn;}(r,e,n);var u,c,s,l=function(t){if(t===o&&y)return y;if(!gn&&t in v)return v[t];switch(t){case bn:case _n:case wn:return function(){return new r(this,t)}}return function(){return new r(this)}},h=e+" Iterator",p=!1,v=t.prototype,d=v[mn]||v["@@iterator"]||o&&v[o],y=!gn&&d||l(o),g="Array"==e&&v.entries||d;if(g&&(u=fn(g.call(new t)),yn!==Object.prototype&&u.next&&(fr(u,h,!0,!0),an[h]=On)),o==_n&&d&&d.name!==_n&&(p=!0,y=function(){return d.call(this)}),a&&v[mn]!==y&&G(v,mn,y),an[e]=y,o)if(c={values:l(_n),keys:i?y:l(bn),entries:l(wn)},a)for(s in c)(gn||p||!(s in v))&&Xe(v,s,c[s]);else V({target:e,proto:!0,forced:gn||p},c);return c},Sn="Array Iterator",kn=Sr.set,jn=Sr.getterFor(Sn);xn(Array,"Array",(function(t,e){kn(this,{type:Sn,target:y(t),index:0,kind:e});}),(function(){var t=jn(this),e=t.target,r=t.kind,n=t.index++;return !e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==r?{value:n,done:!1}:"values"==r?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values");an.Arguments=an.Array;var An=ft("toStringTag");for(var En in {CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}){var Pn=o[En],In=Pn&&Pn.prototype;In&&ar(In)!==An&&G(In,An,En),an[En]=an.Array;}var Tn=function(t){return function(e,r){var n,o,i=String(d(e)),a=B(r),u=i.length;return a<0||a>=u?t?"":void 0:(n=i.charCodeAt(a))<55296||n>56319||a+1===u||(o=i.charCodeAt(a+1))<56320||o>57343?t?i.charAt(a):n:t?i.slice(a,a+2):o-56320+(n-55296<<10)+65536}},Dn={codeAt:Tn(!1),charAt:Tn(!0)}.charAt,Ln="String Iterator",Cn=Sr.set,Rn=Sr.getterFor(Ln);xn(String,"String",(function(t){Cn(this,{type:Ln,string:String(t),index:0});}),(function(){var t,e=Rn(this),r=e.string,n=e.index;return n>=r.length?{value:void 0,done:!0}:(t=Dn(r,n),e.index+=t.length,{value:t,done:!1})}));var Mn=ft("iterator"),Fn=function(t){if(null!=t)return t[Mn]||t["@@iterator"]||an[ar(t)]},Nn=function(t){var e=Fn(t);if("function"!=typeof e)throw TypeError(String(t)+" is not iterable");return F(e.call(t))},qn=Fn,Gn=function(t){var e=t.return;if(void 0!==e)return F(e.call(t)).value},zn=function(t,e,r,n){try{return n?e(F(r)[0],r[1]):e(r)}catch(e){throw Gn(t),e}},Un=ft("iterator"),Vn=Array.prototype,Jn=function(t){return void 0!==t&&(an.Array===t||Vn[Un]===t)},$n=ft("iterator"),Wn=!1;try{var Bn=0,Kn={next:function(){return {done:!!Bn++}},return:function(){Wn=!0;}};Kn[$n]=function(){return this},Array.from(Kn,(function(){throw 2}));}catch(t){}var Qn=!function(t,e){if(!e&&!Wn)return !1;var r=!1;try{var n={};n[$n]=function(){return {next:function(){return {done:r=!0}}}},t(n);}catch(t){}return r}((function(t){Array.from(t);}));V({target:"Array",stat:!0,forced:Qn},{from:function(t){var e,r,n,o,i,a,u=X(t),c="function"==typeof this?this:Array,s=arguments.length,f=s>1?arguments[1]:void 0,l=void 0!==f,h=Fn(u),p=0;if(l&&(f=M(f,s>2?arguments[2]:void 0,2)),null==h||c==Array&&Jn(h))for(r=new c(e=Q(u.length));e>p;p++)a=l?f(u[p],p):u[p],Ce(r,p,a);else for(i=(o=h.call(u)).next,r=new c;!(n=i.call(o)).done;p++)a=l?zn(o,f,[n.value,p],!0):n.value,Ce(r,p,a);return r.length=p,r}});var Yn=C.Array.from,Hn=Yn;V({target:"Object",stat:!0,sham:!a},{create:Be});var Xn=C.Object,Zn=function(t,e){return Xn.create(t,e)},to=Zn;var eo,ro=function(t,e,r){return e in t?he(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t},no="\t\n\v\f\r                　\u2028\u2029\ufeff",oo="["+no+"]",io=RegExp("^"+oo+oo+"*"),ao=RegExp(oo+oo+"*$"),uo=function(t){return function(e){var r=String(d(e));return 1&t&&(r=r.replace(io,"")),2&t&&(r=r.replace(ao,"")),r}},co={start:uo(1),end:uo(2),trim:uo(3)},so=co.trim;V({target:"String",proto:!0,forced:(eo="trim",i((function(){return !!no[eo]()||"​᠎"!="​᠎"[eo]()||no[eo].name!==eo})))},{trim:function(){return so(this)}});dt("String").trim;var fo=wt.forEach,lo=Qt("forEach"),ho=Ct("forEach"),po=lo&&ho?[].forEach:function(t){return fo(this,t,arguments.length>1?arguments[1]:void 0)};V({target:"Array",proto:!0,forced:[].forEach!=po},{forEach:po});var vo=dt("Array").forEach,yo=Array.prototype,go={DOMTokenList:!0,NodeList:!0},mo=function(t){var e=t.forEach;return t===yo||t instanceof Array&&e===yo.forEach||go.hasOwnProperty(ar(t))?vo:e},bo=co.trim,_o=o.parseInt,wo=/^[+-]?0[Xx]/,Oo=8!==_o(no+"08")||22!==_o(no+"0x16")?function(t,e){var r=bo(String(t));return _o(r,e>>>0||(wo.test(r)?16:10))}:_o;V({global:!0,forced:parseInt!=Oo},{parseInt:Oo});var xo=s.f,So=function(t){return function(e){for(var r,n=y(e),o=Ae(n),i=o.length,u=0,c=[];i>u;)r=o[u++],a&&!xo.call(n,r)||c.push(t?[r,n[r]]:n[r]);return c}},ko={entries:So(!0),values:So(!1)}.values;V({target:"Object",stat:!0},{values:function(t){return ko(t)}});C.Object.values;var jo=i((function(){fn(1);}));V({target:"Object",stat:!0,forced:jo,sham:!un},{getPrototypeOf:function(t){return fn(X(t))}});var Ao=C.Object.getPrototypeOf,Eo=Oe.indexOf,Po=[].indexOf,Io=!!Po&&1/[1].indexOf(1,-0)<0,To=Qt("indexOf"),Do=Ct("indexOf",{ACCESSORS:!0,1:0});V({target:"Array",proto:!0,forced:Io||!To||!Do},{indexOf:function(t){return Io?Po.apply(this,arguments)||0:Eo(this,t,arguments.length>1?arguments[1]:void 0)}});dt("Array").indexOf;var Lo=Object.assign,Co=Object.defineProperty,Ro=!Lo||i((function(){if(a&&1!==Lo({b:1},Lo(Co({},"a",{enumerable:!0,get:function(){Co(this,"b",{value:3,enumerable:!1});}}),{b:2})).b)return !0;var t={},e={},r=Symbol(),n="abcdefghijklmnopqrst";return t[r]=7,n.split("").forEach((function(t){e[t]=t;})),7!=Lo({},t)[r]||Ae(Lo({},e)).join("")!=n}))?function(t,e){for(var r=X(t),n=arguments.length,o=1,i=De.f,u=s.f;n>o;)for(var c,f=v(arguments[o++]),l=i?Ae(f).concat(i(f)):Ae(f),h=l.length,p=0;h>p;)c=l[p++],a&&!u.call(f,c)||(r[c]=f[c]);return r}:Lo;V({target:"Object",stat:!0,forced:Object.assign!==Ro},{assign:Ro});var Mo=C.Object.assign;V({target:"Array",stat:!0},{isArray:J});var Fo=C.Array.isArray,No=Fo;var qo=function(t){if(No(t))return t},Go=ft("iterator"),zo=function(t){var e=Object(t);return void 0!==e[Go]||"@@iterator"in e||an.hasOwnProperty(ar(e))},Uo=ft("isConcatSpreadable"),Vo=9007199254740991,Jo="Maximum allowed index exceeded",$o=Et>=51||!i((function(){var t=[];return t[Uo]=!1,t.concat()[0]!==t})),Wo=It("concat"),Bo=function(t){if(!g(t))return !1;var e=t[Uo];return void 0!==e?!!e:J(t)};V({target:"Array",proto:!0,forced:!$o||!Wo},{concat:function(t){var e,r,n,o,i,a=X(this),u=ht(a,0),c=0;for(e=-1,n=arguments.length;e<n;e++)if(Bo(i=-1===e?a:arguments[e])){if(c+(o=Q(i.length))>Vo)throw TypeError(Jo);for(r=0;r<o;r++,c++)r in i&&Ce(u,c,i[r]);}else {if(c>=Vo)throw TypeError(Jo);Ce(u,c++,i);}return u.length=c,u}}),er("asyncIterator"),er("hasInstance"),er("isConcatSpreadable"),er("iterator"),er("match"),er("matchAll"),er("replace"),er("search"),er("species"),er("split"),er("toPrimitive"),er("toStringTag"),er("unscopables"),fr(o.JSON,"JSON",!0);var Ko=C.Symbol;er("asyncDispose"),er("dispose"),er("observable"),er("patternMatch"),er("replaceAll");var Qo=Ko;var Yo=function(t,e){if(void 0!==Qo&&zo(Object(t))){var r=[],n=!0,o=!1,i=void 0;try{for(var a,u=Nn(t);!(n=(a=u.next()).done)&&(r.push(a.value),!e||r.length!==e);n=!0);}catch(t){o=!0,i=t;}finally{try{n||null==u.return||u.return();}finally{if(o)throw i}}return r}},Ho=Yn,Xo=It("slice"),Zo=Ct("slice",{ACCESSORS:!0,0:0,1:2}),ti=ft("species"),ei=[].slice,ri=Math.max;V({target:"Array",proto:!0,forced:!Xo||!Zo},{slice:function(t,e){var r,n,o,i=y(this),a=Q(i.length),u=_e(t,a),c=_e(void 0===e?a:e,a);if(J(i)&&("function"!=typeof(r=i.constructor)||r!==Array&&!J(r.prototype)?g(r)&&null===(r=r[ti])&&(r=void 0):r=void 0,r===Array||void 0===r))return ei.call(i,u,c);for(n=new(void 0===r?Array:r)(ri(c-u,0)),o=0;u<c;u++,o++)u in i&&Ce(n,o,i[u]);return n.length=o,n}});var ni=dt("Array").slice,oi=Array.prototype,ii=function(t){var e=t.slice;return t===oi||t instanceof Array&&e===oi.slice?ni:e},ai=ii;var ui=function(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n};var ci=function(t,e){var r;if(t){if("string"==typeof t)return ui(t,e);var n=ai(r=Object.prototype.toString.call(t)).call(r,8,-1);return "Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Ho(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ui(t,e):void 0}};var si=function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")};var fi=function(t,e){return qo(t)||Yo(t,e)||ci(t,e)||si()};V({target:"Date",stat:!0},{now:function(){return (new Date).getTime()}});C.Date.now;var li=i((function(){Ae(1);}));V({target:"Object",stat:!0,forced:li},{keys:function(t){return Ae(X(t))}});var hi=C.Object.keys,pi=Fo,vi=Ze.f("iterator"),di=vi,yi=r((function(t){function e(r){return t.exports=e="function"==typeof Qo&&"symbol"==typeof di?function(t){return typeof t}:function(t){return t&&"function"==typeof Qo&&t.constructor===Qo&&t!==Qo.prototype?"symbol":typeof t},e(r)}t.exports=e;}));V({target:"Reflect",stat:!0},{ownKeys:Le});var gi=C.Reflect.ownKeys,mi=ii;var bi=function(t){if(No(t))return ui(t)};var _i=function(t){if(void 0!==Qo&&zo(Object(t)))return Ho(t)};var wi=function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")};var Oi=function(t){return bi(t)||_i(t)||ci(t)||wi()},xi=dt("Array").concat,Si=Array.prototype,ki=function(t){var e=t.concat;return t===Si||t instanceof Array&&e===Si.concat?xi:e},ji=Ko;function Ai(t,e){var r;if(void 0===ji||null==qn(t)){if(pi(t)||(r=function(t,e){var r;if(!t)return;if("string"==typeof t)return Ei(t,e);var n=mi(r=Object.prototype.toString.call(t)).call(r,8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Hn(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return Ei(t,e)}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return {s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,u=!1;return {s:function(){r=Nn(t);},n:function(){var t=r.next();return a=t.done,t},e:function(t){u=!0,i=t;},f:function(){try{a||null==r.return||r.return();}finally{if(u)throw i}}}}function Ei(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}
    /**
    	 * vis-util
    	 * https://github.com/visjs/vis-util
    	 *
    	 * utilitie collection for visjs
    	 *
    	 * @version 4.3.4
    	 * @date    2020-08-01T15:11:53.524Z
    	 *
    	 * @copyright (c) 2011-2017 Almende B.V, http://almende.com
    	 * @copyright (c) 2017-2019 visjs contributors, https://github.com/visjs
    	 *
    	 * @license
    	 * vis.js is dual licensed under both
    	 *
    	 *   1. The Apache 2.0 License
    	 *      http://www.apache.org/licenses/LICENSE-2.0
    	 *
    	 *   and
    	 *
    	 *   2. The MIT License
    	 *      http://opensource.org/licenses/MIT
    	 *
    	 * vis.js may be distributed under either license.
    	 */var Pi=ji("DELETE");function Ii(){var t=Ti.apply(void 0,arguments);return Li(t),t}function Ti(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];if(e.length<2)return e[0];var n;if(e.length>2)return Ti.apply(void 0,ki(n=[Ii(e[0],e[1])]).call(n,Oi(mi(e).call(e,2))));var o,i=e[0],a=e[1],u=Ai(gi(a));try{for(u.s();!(o=u.n()).done;){var c=o.value;Object.prototype.propertyIsEnumerable.call(a,c)&&(a[c]===Pi?delete i[c]:null===i[c]||null===a[c]||"object"!==yi(i[c])||"object"!==yi(a[c])||pi(i[c])||pi(a[c])?i[c]=Di(a[c]):i[c]=Ti(i[c],a[c]));}}catch(t){u.e(t);}finally{u.f();}return i}function Di(t){return pi(t)?Gt(t).call(t,(function(t){return Di(t)})):"object"===yi(t)&&null!==t?Ti({},t):t}function Li(t){for(var e=0,r=hi(t);e<r.length;e++){var n=r[e];t[n]===Pi?delete t[n]:"object"===yi(t[n])&&null!==t[n]&&Li(t[n]);}}var Ci=xt("Reflect","construct"),Ri=i((function(){function t(){}return !(Ci((function(){}),[],t)instanceof t)})),Mi=!i((function(){Ci((function(){}));})),Fi=Ri||Mi;V({target:"Reflect",stat:!0,forced:Fi,sham:Fi},{construct:function(t,e){R(t),F(e);var r=arguments.length<3?t:R(arguments[2]);if(Mi&&!Ri)return Ci(t,e,r);if(t==r){switch(e.length){case 0:return new t;case 1:return new t(e[0]);case 2:return new t(e[0],e[1]);case 3:return new t(e[0],e[1],e[2]);case 4:return new t(e[0],e[1],e[2],e[3])}var n=[null];return n.push.apply(n,e),new(ae.apply(t,n))}var o=r.prototype,i=Be(g(o)?o:Object.prototype),a=Function.apply.call(t,i,e);return g(a)?a:i}});var Ni=C.Reflect.construct,qi=dt("Array").entries,Gi=Array.prototype,zi={DOMTokenList:!0,NodeList:!0},Ui=function(t){var e=t.entries;return t===Gi||t instanceof Array&&e===Gi.entries||zi.hasOwnProperty(ar(t))?qi:e},Vi=r((function(t){var e=function(t){var e,r=Object.prototype,n=r.hasOwnProperty,o="function"==typeof Symbol?Symbol:{},i=o.iterator||"@@iterator",a=o.asyncIterator||"@@asyncIterator",u=o.toStringTag||"@@toStringTag";function c(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{c({},"");}catch(t){c=function(t,e,r){return t[e]=r};}function s(t,e,r,n){var o=e&&e.prototype instanceof y?e:y,i=Object.create(o.prototype),a=new E(n||[]);return i._invoke=function(t,e,r){var n=l;return function(o,i){if(n===p)throw new Error("Generator is already running");if(n===v){if("throw"===o)throw i;return I()}for(r.method=o,r.arg=i;;){var a=r.delegate;if(a){var u=k(a,r);if(u){if(u===d)continue;return u}}if("next"===r.method)r.sent=r._sent=r.arg;else if("throw"===r.method){if(n===l)throw n=v,r.arg;r.dispatchException(r.arg);}else "return"===r.method&&r.abrupt("return",r.arg);n=p;var c=f(t,e,r);if("normal"===c.type){if(n=r.done?v:h,c.arg===d)continue;return {value:c.arg,done:r.done}}"throw"===c.type&&(n=v,r.method="throw",r.arg=c.arg);}}}(t,r,a),i}function f(t,e,r){try{return {type:"normal",arg:t.call(e,r)}}catch(t){return {type:"throw",arg:t}}}t.wrap=s;var l="suspendedStart",h="suspendedYield",p="executing",v="completed",d={};function y(){}function g(){}function m(){}var b={};b[i]=function(){return this};var _=Object.getPrototypeOf,w=_&&_(_(P([])));w&&w!==r&&n.call(w,i)&&(b=w);var O=m.prototype=y.prototype=Object.create(b);function x(t){["next","throw","return"].forEach((function(e){c(t,e,(function(t){return this._invoke(e,t)}));}));}function S(t,e){function r(o,i,a,u){var c=f(t[o],t,i);if("throw"!==c.type){var s=c.arg,l=s.value;return l&&"object"==typeof l&&n.call(l,"__await")?e.resolve(l.__await).then((function(t){r("next",t,a,u);}),(function(t){r("throw",t,a,u);})):e.resolve(l).then((function(t){s.value=t,a(s);}),(function(t){return r("throw",t,a,u)}))}u(c.arg);}var o;this._invoke=function(t,n){function i(){return new e((function(e,o){r(t,n,e,o);}))}return o=o?o.then(i,i):i()};}function k(t,r){var n=t.iterator[r.method];if(n===e){if(r.delegate=null,"throw"===r.method){if(t.iterator.return&&(r.method="return",r.arg=e,k(t,r),"throw"===r.method))return d;r.method="throw",r.arg=new TypeError("The iterator does not provide a 'throw' method");}return d}var o=f(n,t.iterator,r.arg);if("throw"===o.type)return r.method="throw",r.arg=o.arg,r.delegate=null,d;var i=o.arg;return i?i.done?(r[t.resultName]=i.value,r.next=t.nextLoc,"return"!==r.method&&(r.method="next",r.arg=e),r.delegate=null,d):i:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,d)}function j(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e);}function A(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e;}function E(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(j,this),this.reset(!0);}function P(t){if(t){var r=t[i];if(r)return r.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var o=-1,a=function r(){for(;++o<t.length;)if(n.call(t,o))return r.value=t[o],r.done=!1,r;return r.value=e,r.done=!0,r};return a.next=a}}return {next:I}}function I(){return {value:e,done:!0}}return g.prototype=O.constructor=m,m.constructor=g,g.displayName=c(m,u,"GeneratorFunction"),t.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return !!e&&(e===g||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,m):(t.__proto__=m,c(t,u,"GeneratorFunction")),t.prototype=Object.create(O),t},t.awrap=function(t){return {__await:t}},x(S.prototype),S.prototype[a]=function(){return this},t.AsyncIterator=S,t.async=function(e,r,n,o,i){void 0===i&&(i=Promise);var a=new S(s(e,r,n,o),i);return t.isGeneratorFunction(r)?a:a.next().then((function(t){return t.done?t.value:a.next()}))},x(O),c(O,u,"Generator"),O[i]=function(){return this},O.toString=function(){return "[object Generator]"},t.keys=function(t){var e=[];for(var r in t)e.push(r);return e.reverse(),function r(){for(;e.length;){var n=e.pop();if(n in t)return r.value=n,r.done=!1,r}return r.done=!0,r}},t.values=P,E.prototype={constructor:E,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=e,this.done=!1,this.delegate=null,this.method="next",this.arg=e,this.tryEntries.forEach(A),!t)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=e);},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var r=this;function o(n,o){return u.type="throw",u.arg=t,r.next=n,o&&(r.method="next",r.arg=e),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var a=this.tryEntries[i],u=a.completion;if("root"===a.tryLoc)return o("end");if(a.tryLoc<=this.prev){var c=n.call(a,"catchLoc"),s=n.call(a,"finallyLoc");if(c&&s){if(this.prev<a.catchLoc)return o(a.catchLoc,!0);if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else if(c){if(this.prev<a.catchLoc)return o(a.catchLoc,!0)}else {if(!s)throw new Error("try statement without catch or finally");if(this.prev<a.finallyLoc)return o(a.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method="next",this.next=i.finallyLoc,d):this.complete(a)},complete:function(t,e){if("throw"===t.type)throw t.arg;return "break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),d},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),A(r),d}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;A(r);}return o}}throw new Error("illegal catch attempt")},delegateYield:function(t,r,n){return this.delegate={iterator:P(t),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=e),d}},t}(t.exports);try{regeneratorRuntime=e;}catch(t){Function("r","regeneratorRuntime = r")(e);}})),Ji=vi,$i=xt("JSON","stringify"),Wi=/[\uD800-\uDFFF]/g,Bi=/^[\uD800-\uDBFF]$/,Ki=/^[\uDC00-\uDFFF]$/,Qi=function(t,e,r){var n=r.charAt(e-1),o=r.charAt(e+1);return Bi.test(t)&&!Ki.test(o)||Ki.test(t)&&!Bi.test(n)?"\\u"+t.charCodeAt(0).toString(16):t},Yi=i((function(){return '"\\udf06\\ud834"'!==$i("\udf06\ud834")||'"\\udead"'!==$i("\udead")}));$i&&V({target:"JSON",stat:!0,forced:Yi},{stringify:function(t,e,r){var n=$i.apply(null,arguments);return "string"==typeof n?n.replace(Wi,Qi):n}}),C.JSON||(C.JSON={stringify:JSON.stringify});var Hi=function(t,e,r){return C.JSON.stringify.apply(null,arguments)},Xi=dt("Array").values,Zi=Array.prototype,ta={DOMTokenList:!0,NodeList:!0},ea=function(t){var e=t.values;return t===Zi||t instanceof Array&&e===Zi.values||ta.hasOwnProperty(ar(t))?Xi:e},ra=[],na=ra.sort,oa=i((function(){ra.sort(void 0);})),ia=i((function(){ra.sort(null);})),aa=Qt("sort");V({target:"Array",proto:!0,forced:oa||!ia||!aa},{sort:function(t){return void 0===t?na.call(X(this)):na.call(X(this),R(t))}});var ua=dt("Array").sort,ca=Array.prototype,sa=function(t){var e=t.sort;return t===ca||t instanceof Array&&e===ca.sort?ua:e},fa=dt("Array").keys,la=Array.prototype,ha={DOMTokenList:!0,NodeList:!0},pa=function(t){var e=t.keys;return t===la||t instanceof Array&&e===la.keys||ha.hasOwnProperty(ar(t))?fa:e},va=wt.some,da=Qt("some"),ya=Ct("some");V({target:"Array",proto:!0,forced:!da||!ya},{some:function(t){return va(this,t,arguments.length>1?arguments[1]:void 0)}});var ga=dt("Array").some,ma=Array.prototype,ba=function(t){var e=t.some;return t===ma||t instanceof Array&&e===ma.some?ga:e},_a=!i((function(){return Object.isExtensible(Object.preventExtensions({}))})),wa=r((function(t){var e=q.f,r=ot("meta"),n=0,o=Object.isExtensible||function(){return !0},i=function(t){e(t,r,{value:{objectID:"O"+ ++n,weakData:{}}});},a=t.exports={REQUIRED:!1,fastKey:function(t,e){if(!g(t))return "symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!_(t,r)){if(!o(t))return "F";if(!e)return "E";i(t);}return t[r].objectID},getWeakData:function(t,e){if(!_(t,r)){if(!o(t))return !0;if(!e)return !1;i(t);}return t[r].weakData},onFreeze:function(t){return _a&&a.REQUIRED&&o(t)&&!_(t,r)&&i(t),t}};xe[r]=!0;})),Oa=function(t,e){this.stopped=t,this.result=e;},xa=function(t,e,r){var n,o,i,a,u,c,s,f=r&&r.that,l=!(!r||!r.AS_ENTRIES),h=!(!r||!r.IS_ITERATOR),p=!(!r||!r.INTERRUPTED),v=M(e,f,1+l+p),d=function(t){return n&&Gn(n),new Oa(!0,t)},y=function(t){return l?(F(t),p?v(t[0],t[1],d):v(t[0],t[1])):p?v(t,d):v(t)};if(h)n=t;else {if("function"!=typeof(o=Fn(t)))throw TypeError("Target is not iterable");if(Jn(o)){for(i=0,a=Q(t.length);a>i;i++)if((u=y(t[i]))&&u instanceof Oa)return u;return new Oa(!1)}n=o.call(t);}for(c=n.next;!(s=c.call(n)).done;){try{u=y(s.value);}catch(t){throw Gn(n),t}if("object"==typeof u&&u&&u instanceof Oa)return u}return new Oa(!1)},Sa=function(t,e,r){if(!(t instanceof e))throw TypeError("Incorrect "+(r?r+" ":"")+"invocation");return t},ka=q.f,ja=wt.forEach,Aa=Sr.set,Ea=Sr.getterFor,Pa=function(t,e,r){var n,u=-1!==t.indexOf("Map"),c=-1!==t.indexOf("Weak"),s=u?"set":"add",f=o[t],l=f&&f.prototype,h={};if(a&&"function"==typeof f&&(c||l.forEach&&!i((function(){(new f).entries().next();})))){n=e((function(e,r){Aa(Sa(e,n,t),{type:t,collection:new f}),null!=r&&xa(r,e[s],{that:e,AS_ENTRIES:u});}));var p=Ea(t);ja(["add","clear","delete","forEach","get","has","set","keys","values","entries"],(function(t){var e="add"==t||"set"==t;!(t in l)||c&&"clear"==t||G(n.prototype,t,(function(r,n){var o=p(this).collection;if(!e&&c&&!g(r))return "get"==t&&void 0;var i=o[t](0===r?0:r,n);return e?this:i}));})),c||ka(n.prototype,"size",{configurable:!0,get:function(){return p(this).collection.size}});}else n=r.getConstructor(e,t,u,s),wa.REQUIRED=!0;return fr(n,t,!1,!0),h[t]=n,V({global:!0,forced:!0},h),c||r.setStrong(n,t,u),n},Ia=function(t,e,r){for(var n in e)r&&r.unsafe&&t[n]?t[n]=e[n]:Xe(t,n,e[n],r);return t},Ta=ft("species"),Da=q.f,La=wa.fastKey,Ca=Sr.set,Ra=Sr.getterFor,Ma={getConstructor:function(t,e,r,n){var o=t((function(t,i){Sa(t,o,e),Ca(t,{type:e,index:Be(null),first:void 0,last:void 0,size:0}),a||(t.size=0),null!=i&&xa(i,t[n],{that:t,AS_ENTRIES:r});})),i=Ra(e),u=function(t,e,r){var n,o,u=i(t),s=c(t,e);return s?s.value=r:(u.last=s={index:o=La(e,!0),key:e,value:r,previous:n=u.last,next:void 0,removed:!1},u.first||(u.first=s),n&&(n.next=s),a?u.size++:t.size++,"F"!==o&&(u.index[o]=s)),t},c=function(t,e){var r,n=i(t),o=La(e);if("F"!==o)return n.index[o];for(r=n.first;r;r=r.next)if(r.key==e)return r};return Ia(o.prototype,{clear:function(){for(var t=i(this),e=t.index,r=t.first;r;)r.removed=!0,r.previous&&(r.previous=r.previous.next=void 0),delete e[r.index],r=r.next;t.first=t.last=void 0,a?t.size=0:this.size=0;},delete:function(t){var e=this,r=i(e),n=c(e,t);if(n){var o=n.next,u=n.previous;delete r.index[n.index],n.removed=!0,u&&(u.next=o),o&&(o.previous=u),r.first==n&&(r.first=o),r.last==n&&(r.last=u),a?r.size--:e.size--;}return !!n},forEach:function(t){for(var e,r=i(this),n=M(t,arguments.length>1?arguments[1]:void 0,3);e=e?e.next:r.first;)for(n(e.value,e.key,this);e&&e.removed;)e=e.previous;},has:function(t){return !!c(this,t)}}),Ia(o.prototype,r?{get:function(t){var e=c(this,t);return e&&e.value},set:function(t,e){return u(this,0===t?0:t,e)}}:{add:function(t){return u(this,t=0===t?0:t,t)}}),a&&Da(o.prototype,"size",{get:function(){return i(this).size}}),o},setStrong:function(t,e,r){var n=e+" Iterator",o=Ra(e),i=Ra(n);xn(t,e,(function(t,e){Ca(this,{type:n,target:t,state:o(t),kind:e,last:void 0});}),(function(){for(var t=i(this),e=t.kind,r=t.last;r&&r.removed;)r=r.previous;return t.target&&(t.last=r=r?r.next:t.state.first)?"keys"==e?{value:r.key,done:!1}:"values"==e?{value:r.value,done:!1}:{value:[r.key,r.value],done:!1}:(t.target=void 0,{value:void 0,done:!0})}),r?"entries":"values",!r,!0),function(t){var e=xt(t),r=q.f;a&&e&&!e[Ta]&&r(e,Ta,{configurable:!0,get:function(){return this}});}(e);}},Fa=(Pa("Map",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),Ma),C.Map),Na=Zn;V({target:"Object",stat:!0},{setPrototypeOf:dn});var qa=C.Object.setPrototypeOf,Ga=r((function(t){function e(r,n){return t.exports=e=qa||function(t,e){return t.__proto__=e,t},e(r,n)}t.exports=e;}));var za=function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Na(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&Ga(t,e);};var Ua=function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t};var Va=function(t,e){return !e||"object"!==yi(e)&&"function"!=typeof e?Ua(t):e},Ja=Ao,$a=r((function(t){function e(r){return t.exports=e=qa?Ja:function(t){return t.__proto__||Ja(t)},e(r)}t.exports=e;})),Wa="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto),Ba=new Uint8Array(16);function Ka(){if(!Wa)throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return Wa(Ba)}var Qa=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;function Ya(t){return "string"==typeof t&&Qa.test(t)}for(var Ha=[],Xa=0;Xa<256;++Xa)Ha.push((Xa+256).toString(16).substr(1));function Za(t,e,r){var n=(t=t||{}).random||(t.rng||Ka)();if(n[6]=15&n[6]|64,n[8]=63&n[8]|128,e){r=r||0;for(var o=0;o<16;++o)e[r+o]=n[o];return e}return function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,r=(Ha[t[e+0]]+Ha[t[e+1]]+Ha[t[e+2]]+Ha[t[e+3]]+"-"+Ha[t[e+4]]+Ha[t[e+5]]+"-"+Ha[t[e+6]]+Ha[t[e+7]]+"-"+Ha[t[e+8]]+Ha[t[e+9]]+"-"+Ha[t[e+10]]+Ha[t[e+11]]+Ha[t[e+12]]+Ha[t[e+13]]+Ha[t[e+14]]+Ha[t[e+15]]).toLowerCase();if(!Ya(r))throw TypeError("Stringified UUID is invalid");return r}(n)}function tu(t){return "string"==typeof t||"number"==typeof t}var eu=It("splice"),ru=Ct("splice",{ACCESSORS:!0,0:0,1:2}),nu=Math.max,ou=Math.min,iu=9007199254740991,au="Maximum allowed length exceeded";V({target:"Array",proto:!0,forced:!eu||!ru},{splice:function(t,e){var r,n,o,i,a,u,c=X(this),s=Q(c.length),f=_e(t,s),l=arguments.length;if(0===l?r=n=0:1===l?(r=0,n=s-f):(r=l-2,n=ou(nu(B(e),0),s-f)),s+r-n>iu)throw TypeError(au);for(o=ht(c,n),i=0;i<n;i++)(a=f+i)in c&&Ce(o,i,c[a]);if(o.length=n,r<n){for(i=f;i<s-n;i++)u=i+r,(a=i+n)in c?c[u]=c[a]:delete c[u];for(i=s;i>s-n+r;i--)delete c[i-1];}else if(r>n)for(i=s-n;i>f;i--)u=i+r-1,(a=i+n-1)in c?c[u]=c[a]:delete c[u];for(i=0;i<r;i++)c[i+f]=arguments[i+2];return c.length=s-n+r,o}});var uu=dt("Array").splice,cu=Array.prototype,su=function(t){var e=t.splice;return t===cu||t instanceof Array&&e===cu.splice?uu:e},fu=[].slice,lu=/MSIE .\./.test(St),hu=function(t){return function(e,r){var n=arguments.length>2,o=n?fu.call(arguments,2):void 0;return t(n?function(){("function"==typeof e?e:Function(e)).apply(this,o);}:e,r)}};V({global:!0,bind:!0,forced:lu},{setTimeout:hu(o.setTimeout),setInterval:hu(o.setInterval)});var pu=C.setTimeout,vu=function(){function t(e){fe(this,t),this._queue=[],this._timeout=null,this._extended=null,this.delay=null,this.max=1/0,this.setOptions(e);}return ve(t,[{key:"setOptions",value:function(t){t&&void 0!==t.delay&&(this.delay=t.delay),t&&void 0!==t.max&&(this.max=t.max),this._flushIfNeeded();}},{key:"destroy",value:function(){if(this.flush(),this._extended){for(var t=this._extended.object,e=this._extended.methods,r=0;r<e.length;r++){var n=e[r];n.original?t[n.name]=n.original:delete t[n.name];}this._extended=null;}}},{key:"replace",value:function(t,e){var r=this,n=t[e];if(!n)throw new Error("Method "+e+" undefined");t[e]=function(){for(var t=arguments.length,e=new Array(t),o=0;o<t;o++)e[o]=arguments[o];r.queue({args:e,fn:n,context:this});};}},{key:"queue",value:function(t){"function"==typeof t?this._queue.push({fn:t}):this._queue.push(t),this._flushIfNeeded();}},{key:"_flushIfNeeded",value:function(){var t=this;this._queue.length>this.max&&this.flush(),null!=this._timeout&&(clearTimeout(this._timeout),this._timeout=null),this.queue.length>0&&"number"==typeof this.delay&&(this._timeout=pu((function(){t.flush();}),this.delay));}},{key:"flush",value:function(){var t,e;mo(t=su(e=this._queue).call(e,0)).call(t,(function(t){t.fn.apply(t.context||t.fn,t.args||[]);}));}}],[{key:"extend",value:function(e,r){var n=new t(r);if(void 0!==e.flush)throw new Error("Target object already has a property flush");e.flush=function(){n.flush();};var o=[{name:"flush",original:void 0}];if(r&&r.replace)for(var i=0;i<r.replace.length;i++){var a=r.replace[i];o.push({name:a,original:e[a]}),n.replace(e,a);}return n._extended={object:e,methods:o},n}}]),t}(),du=function(){function t(){fe(this,t),this._subscribers={"*":[],add:[],remove:[],update:[]},this.subscribe=t.prototype.on,this.unsubscribe=t.prototype.off;}return ve(t,[{key:"_trigger",value:function(t,e,r){var n,o;if("*"===t)throw new Error("Cannot trigger event *");mo(n=ki(o=[]).call(o,Oi(this._subscribers[t]),Oi(this._subscribers["*"]))).call(n,(function(n){n(t,e,null!=r?r:null);}));}},{key:"on",value:function(t,e){"function"==typeof e&&this._subscribers[t].push(e);}},{key:"off",value:function(t,e){var r;this._subscribers[t]=Wt(r=this._subscribers[t]).call(r,(function(t){return t!==e}));}}]),t}(),yu=(Pa("Set",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),Ma),C.Set);function gu(t,e){var r;if(void 0===ji||null==qn(t)){if(pi(t)||(r=function(t,e){var r;if(!t)return;if("string"==typeof t)return mu(t,e);var n=mi(r=Object.prototype.toString.call(t)).call(r,8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Hn(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return mu(t,e)}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return {s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,u=!1;return {s:function(){r=Nn(t);},n:function(){var t=r.next();return a=t.done,t},e:function(t){u=!0,i=t;},f:function(){try{a||null==r.return||r.return();}finally{if(u)throw i}}}}function mu(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}var bu=function(){function t(e){fe(this,t),this._pairs=e;}return ve(t,[{key:Ji,value:Vi.mark((function t(){var e,r,n,o,i;return Vi.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=gu(this._pairs),t.prev=1,e.s();case 3:if((r=e.n()).done){t.next=9;break}return n=fi(r.value,2),o=n[0],i=n[1],t.next=7,[o,i];case 7:t.next=3;break;case 9:t.next=14;break;case 11:t.prev=11,t.t0=t.catch(1),e.e(t.t0);case 14:return t.prev=14,e.f(),t.finish(14);case 17:case"end":return t.stop()}}),t,this,[[1,11,14,17]])}))},{key:"entries",value:Vi.mark((function t(){var e,r,n,o,i;return Vi.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=gu(this._pairs),t.prev=1,e.s();case 3:if((r=e.n()).done){t.next=9;break}return n=fi(r.value,2),o=n[0],i=n[1],t.next=7,[o,i];case 7:t.next=3;break;case 9:t.next=14;break;case 11:t.prev=11,t.t0=t.catch(1),e.e(t.t0);case 14:return t.prev=14,e.f(),t.finish(14);case 17:case"end":return t.stop()}}),t,this,[[1,11,14,17]])}))},{key:"keys",value:Vi.mark((function t(){var e,r,n,o;return Vi.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=gu(this._pairs),t.prev=1,e.s();case 3:if((r=e.n()).done){t.next=9;break}return n=fi(r.value,1),o=n[0],t.next=7,o;case 7:t.next=3;break;case 9:t.next=14;break;case 11:t.prev=11,t.t0=t.catch(1),e.e(t.t0);case 14:return t.prev=14,e.f(),t.finish(14);case 17:case"end":return t.stop()}}),t,this,[[1,11,14,17]])}))},{key:"values",value:Vi.mark((function t(){var e,r,n,o;return Vi.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e=gu(this._pairs),t.prev=1,e.s();case 3:if((r=e.n()).done){t.next=9;break}return n=fi(r.value,2),o=n[1],t.next=7,o;case 7:t.next=3;break;case 9:t.next=14;break;case 11:t.prev=11,t.t0=t.catch(1),e.e(t.t0);case 14:return t.prev=14,e.f(),t.finish(14);case 17:case"end":return t.stop()}}),t,this,[[1,11,14,17]])}))},{key:"toIdArray",value:function(){var t;return Gt(t=Oi(this._pairs)).call(t,(function(t){return t[0]}))}},{key:"toItemArray",value:function(){var t;return Gt(t=Oi(this._pairs)).call(t,(function(t){return t[1]}))}},{key:"toEntryArray",value:function(){return Oi(this._pairs)}},{key:"toObjectMap",value:function(){var t,e=to(null),r=gu(this._pairs);try{for(r.s();!(t=r.n()).done;){var n=fi(t.value,2),o=n[0],i=n[1];e[o]=i;}}catch(t){r.e(t);}finally{r.f();}return e}},{key:"toMap",value:function(){return new Fa(this._pairs)}},{key:"toIdSet",value:function(){return new yu(this.toIdArray())}},{key:"toItemSet",value:function(){return new yu(this.toItemArray())}},{key:"cache",value:function(){return new t(Oi(this._pairs))}},{key:"distinct",value:function(t){var e,r=new yu,n=gu(this._pairs);try{for(n.s();!(e=n.n()).done;){var o=fi(e.value,2),i=o[0],a=o[1];r.add(t(a,i));}}catch(t){n.e(t);}finally{n.f();}return r}},{key:"filter",value:function(e){var r=this._pairs;return new t(ro({},Ji,Vi.mark((function t(){var n,o,i,a,u;return Vi.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:n=gu(r),t.prev=1,n.s();case 3:if((o=n.n()).done){t.next=10;break}if(i=fi(o.value,2),a=i[0],u=i[1],!e(u,a)){t.next=8;break}return t.next=8,[a,u];case 8:t.next=3;break;case 10:t.next=15;break;case 12:t.prev=12,t.t0=t.catch(1),n.e(t.t0);case 15:return t.prev=15,n.f(),t.finish(15);case 18:case"end":return t.stop()}}),t,null,[[1,12,15,18]])}))))}},{key:"forEach",value:function(t){var e,r=gu(this._pairs);try{for(r.s();!(e=r.n()).done;){var n=fi(e.value,2),o=n[0];t(n[1],o);}}catch(t){r.e(t);}finally{r.f();}}},{key:"map",value:function(e){var r=this._pairs;return new t(ro({},Ji,Vi.mark((function t(){var n,o,i,a,u;return Vi.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:n=gu(r),t.prev=1,n.s();case 3:if((o=n.n()).done){t.next=9;break}return i=fi(o.value,2),a=i[0],u=i[1],t.next=7,[a,e(u,a)];case 7:t.next=3;break;case 9:t.next=14;break;case 11:t.prev=11,t.t0=t.catch(1),n.e(t.t0);case 14:return t.prev=14,n.f(),t.finish(14);case 17:case"end":return t.stop()}}),t,null,[[1,11,14,17]])}))))}},{key:"max",value:function(t){var e=Nn(this._pairs),r=e.next();if(r.done)return null;for(var n=r.value[1],o=t(r.value[1],r.value[0]);!(r=e.next()).done;){var i=fi(r.value,2),a=i[0],u=i[1],c=t(u,a);c>o&&(o=c,n=u);}return n}},{key:"min",value:function(t){var e=Nn(this._pairs),r=e.next();if(r.done)return null;for(var n=r.value[1],o=t(r.value[1],r.value[0]);!(r=e.next()).done;){var i=fi(r.value,2),a=i[0],u=i[1],c=t(u,a);c<o&&(o=c,n=u);}return n}},{key:"reduce",value:function(t,e){var r,n=gu(this._pairs);try{for(n.s();!(r=n.n()).done;){var o=fi(r.value,2),i=o[0];e=t(e,o[1],i);}}catch(t){n.e(t);}finally{n.f();}return e}},{key:"sort",value:function(e){var r=this;return new t(ro({},Ji,(function(){var t;return Nn(sa(t=Oi(r._pairs)).call(t,(function(t,r){var n=fi(t,2),o=n[0],i=n[1],a=fi(r,2),u=a[0],c=a[1];return e(i,c,o,u)})))})))}}]),t}();function _u(t,e){var r=hi(t);if(on){var n=on(t);e&&(n=Wt(n).call(n,(function(e){return qe(t,e).enumerable}))),r.push.apply(r,n);}return r}function wu(t){for(var e=1;e<arguments.length;e++){var r,n=null!=arguments[e]?arguments[e]:{};if(e%2)mo(r=_u(Object(n),!0)).call(r,(function(e){ro(t,e,n[e]);}));else if(Re)Pe(t,Re(n));else {var o;mo(o=_u(Object(n))).call(o,(function(e){ge(t,e,qe(n,e));}));}}return t}function Ou(t,e){var r;if(void 0===ji||null==qn(t)){if(pi(t)||(r=function(t,e){var r;if(!t)return;if("string"==typeof t)return xu(t,e);var n=mi(r=Object.prototype.toString.call(t)).call(r,8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Hn(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return xu(t,e)}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return {s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,u=!1;return {s:function(){r=Nn(t);},n:function(){var t=r.next();return a=t.done,t},e:function(t){u=!0,i=t;},f:function(){try{a||null==r.return||r.return();}finally{if(u)throw i}}}}function xu(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function Su(t){var e=function(){if("undefined"==typeof Reflect||!Ni)return !1;if(Ni.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Ni(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var r,n=$a(t);if(e){var o=$a(this).constructor;r=Ni(n,arguments,o);}else r=n.apply(this,arguments);return Va(this,r)}}var ku=function(t){za(r,t);var e=Su(r);function r(t,n){var o;return fe(this,r),(o=e.call(this))._queue=null,t&&!pi(t)&&(n=t,t=[]),o._options=n||{},o._data=new Fa,o.length=0,o._idProp=o._options.fieldId||"id",t&&t.length&&o.add(t),o.setOptions(n),o}return ve(r,[{key:"setOptions",value:function(t){t&&void 0!==t.queue&&(!1===t.queue?this._queue&&(this._queue.destroy(),this._queue=null):(this._queue||(this._queue=vu.extend(this,{replace:["add","update","remove"]})),t.queue&&"object"===yi(t.queue)&&this._queue.setOptions(t.queue)));}},{key:"add",value:function(t,e){var r,n=this,o=[];if(pi(t)){var i=Gt(t).call(t,(function(t){return t[n._idProp]}));if(ba(i).call(i,(function(t){return n._data.has(t)})))throw new Error("A duplicate id was found in the parameter array.");for(var a=0,u=t.length;a<u;a++)r=this._addItem(t[a]),o.push(r);}else {if(!t||"object"!==yi(t))throw new Error("Unknown dataType");r=this._addItem(t),o.push(r);}return o.length&&this._trigger("add",{items:o},e),o}},{key:"update",value:function(t,e){var r=this,n=[],o=[],i=[],a=[],u=this._idProp,c=function(t){var e=t[u];if(null!=e&&r._data.has(e)){var c=t,s=Mo({},r._data.get(e)),f=r._updateItem(c);o.push(f),a.push(c),i.push(s);}else {var l=r._addItem(t);n.push(l);}};if(pi(t))for(var s=0,f=t.length;s<f;s++)t[s]&&"object"===yi(t[s])?c(t[s]):console.warn("Ignoring input item, which is not an object at index "+s);else {if(!t||"object"!==yi(t))throw new Error("Unknown dataType");c(t);}if(n.length&&this._trigger("add",{items:n},e),o.length){var l={items:o,oldData:i,data:a};this._trigger("update",l,e);}return ki(n).call(n,o)}},{key:"updateOnly",value:function(t,e){var r,n=this;pi(t)||(t=[t]);var o=Gt(r=Gt(t).call(t,(function(t){var e=n._data.get(t[n._idProp]);if(null==e)throw new Error("Updating non-existent items is not allowed.");return {oldData:e,update:t}}))).call(r,(function(t){var e=t.oldData,r=t.update,o=e[n._idProp],i=function(t){for(var e,r=arguments.length,n=new Array(r>1?r-1:0),o=1;o<r;o++)n[o-1]=arguments[o];return Ii.apply(void 0,ki(e=[{},t]).call(e,n))}(e,r);return n._data.set(o,i),{id:o,oldData:e,updatedData:i}}));if(o.length){var i={items:Gt(o).call(o,(function(t){return t.id})),oldData:Gt(o).call(o,(function(t){return t.oldData})),data:Gt(o).call(o,(function(t){return t.updatedData}))};return this._trigger("update",i,e),i.items}return []}},{key:"get",value:function(t,e){var r=void 0,n=void 0,o=void 0;tu(t)?(r=t,o=e):pi(t)?(n=t,o=e):o=t;var i,a=o&&"Object"===o.returnType?"Object":"Array",u=o&&Wt(o),c=[],s=void 0,f=void 0,l=void 0;if(null!=r)(s=this._data.get(r))&&u&&!u(s)&&(s=void 0);else if(null!=n)for(var h=0,p=n.length;h<p;h++)null==(s=this._data.get(n[h]))||u&&!u(s)||c.push(s);else for(var v,d=0,y=(f=Oi(pa(v=this._data).call(v))).length;d<y;d++)l=f[d],null==(s=this._data.get(l))||u&&!u(s)||c.push(s);if(o&&o.order&&null==r&&this._sort(c,o.order),o&&o.fields){var g=o.fields;if(null!=r&&null!=s)s=this._filterFields(s,g);else for(var m=0,b=c.length;m<b;m++)c[m]=this._filterFields(c[m],g);}if("Object"==a){for(var _={},w=0,O=c.length;w<O;w++){var x=c[w];_[x[this._idProp]]=x;}return _}return null!=r?null!==(i=s)&&void 0!==i?i:null:c}},{key:"getIds",value:function(t){var e=this._data,r=t&&Wt(t),n=t&&t.order,o=Oi(pa(e).call(e)),i=[];if(r)if(n){for(var a=[],u=0,c=o.length;u<c;u++){var s=o[u],f=this._data.get(s);null!=f&&r(f)&&a.push(f);}this._sort(a,n);for(var l=0,h=a.length;l<h;l++)i.push(a[l][this._idProp]);}else for(var p=0,v=o.length;p<v;p++){var d=o[p],y=this._data.get(d);null!=y&&r(y)&&i.push(y[this._idProp]);}else if(n){for(var g=[],m=0,b=o.length;m<b;m++){var _=o[m];g.push(e.get(_));}this._sort(g,n);for(var w=0,O=g.length;w<O;w++)i.push(g[w][this._idProp]);}else for(var x=0,S=o.length;x<S;x++){var k=o[x],j=e.get(k);null!=j&&i.push(j[this._idProp]);}return i}},{key:"getDataSet",value:function(){return this}},{key:"forEach",value:function(t,e){var r=e&&Wt(e),n=this._data,o=Oi(pa(n).call(n));if(e&&e.order)for(var i=this.get(e),a=0,u=i.length;a<u;a++){var c=i[a];t(c,c[this._idProp]);}else for(var s=0,f=o.length;s<f;s++){var l=o[s],h=this._data.get(l);null==h||r&&!r(h)||t(h,l);}}},{key:"map",value:function(t,e){for(var r=e&&Wt(e),n=[],o=this._data,i=Oi(pa(o).call(o)),a=0,u=i.length;a<u;a++){var c=i[a],s=this._data.get(c);null==s||r&&!r(s)||n.push(t(s,c));}return e&&e.order&&this._sort(n,e.order),n}},{key:"_filterFields",value:function(t,e){var r;return t?re(r=pi(e)?e:hi(e)).call(r,(function(e,r){return e[r]=t[r],e}),{}):t}},{key:"_sort",value:function(t,e){if("string"==typeof e){var r=e;sa(t).call(t,(function(t,e){var n=t[r],o=e[r];return n>o?1:n<o?-1:0}));}else {if("function"!=typeof e)throw new TypeError("Order must be a function or a string");sa(t).call(t,e);}}},{key:"remove",value:function(t,e){for(var r=[],n=[],o=pi(t)?t:[t],i=0,a=o.length;i<a;i++){var u=this._remove(o[i]);if(u){var c=u[this._idProp];null!=c&&(r.push(c),n.push(u));}}return r.length&&this._trigger("remove",{items:r,oldData:n},e),r}},{key:"_remove",value:function(t){var e;if(tu(t)?e=t:t&&"object"===yi(t)&&(e=t[this._idProp]),null!=e&&this._data.has(e)){var r=this._data.get(e)||null;return this._data.delete(e),--this.length,r}return null}},{key:"clear",value:function(t){for(var e,r=Oi(pa(e=this._data).call(e)),n=[],o=0,i=r.length;o<i;o++)n.push(this._data.get(r[o]));return this._data.clear(),this.length=0,this._trigger("remove",{items:r,oldData:n},t),r}},{key:"max",value:function(t){var e,r,n=null,o=null,i=Ou(ea(e=this._data).call(e));try{for(i.s();!(r=i.n()).done;){var a=r.value,u=a[t];"number"==typeof u&&(null==o||u>o)&&(n=a,o=u);}}catch(t){i.e(t);}finally{i.f();}return n||null}},{key:"min",value:function(t){var e,r,n=null,o=null,i=Ou(ea(e=this._data).call(e));try{for(i.s();!(r=i.n()).done;){var a=r.value,u=a[t];"number"==typeof u&&(null==o||u<o)&&(n=a,o=u);}}catch(t){i.e(t);}finally{i.f();}return n||null}},{key:"distinct",value:function(t){for(var e=this._data,r=Oi(pa(e).call(e)),n=[],o=0,i=0,a=r.length;i<a;i++){for(var u=r[i],c=e.get(u)[t],s=!1,f=0;f<o;f++)if(n[f]==c){s=!0;break}s||void 0===c||(n[o]=c,o++);}return n}},{key:"_addItem",value:function(t){var e=function(t,e){return null==t[e]&&(t[e]=Za()),t}(t,this._idProp),r=e[this._idProp];if(this._data.has(r))throw new Error("Cannot add item: item with id "+r+" already exists");return this._data.set(r,e),++this.length,r}},{key:"_updateItem",value:function(t){var e=t[this._idProp];if(null==e)throw new Error("Cannot update item: item has no id (item: "+Hi(t)+")");var r=this._data.get(e);if(!r)throw new Error("Cannot update item: no item with id "+e+" found");return this._data.set(e,wu(wu({},r),t)),e}},{key:"stream",value:function(t){if(t){var e=this._data;return new bu(ro({},Ji,Vi.mark((function r(){var n,o,i,a;return Vi.wrap((function(r){for(;;)switch(r.prev=r.next){case 0:n=Ou(t),r.prev=1,n.s();case 3:if((o=n.n()).done){r.next=11;break}if(i=o.value,null==(a=e.get(i))){r.next=9;break}return r.next=9,[i,a];case 9:r.next=3;break;case 11:r.next=16;break;case 13:r.prev=13,r.t0=r.catch(1),n.e(r.t0);case 16:return r.prev=16,n.f(),r.finish(16);case 19:case"end":return r.stop()}}),r,null,[[1,13,16,19]])}))))}var r;return new bu(ro({},Ji,se(r=Ui(this._data)).call(r,this._data)))}},{key:"idProp",get:function(){return this._idProp}}]),r}(du);function ju(t,e){var r;if(void 0===ji||null==qn(t)){if(pi(t)||(r=function(t,e){var r;if(!t)return;if("string"==typeof t)return Au(t,e);var n=mi(r=Object.prototype.toString.call(t)).call(r,8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Hn(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return Au(t,e)}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return {s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,u=!1;return {s:function(){r=Nn(t);},n:function(){var t=r.next();return a=t.done,t},e:function(t){u=!0,i=t;},f:function(){try{a||null==r.return||r.return();}finally{if(u)throw i}}}}function Au(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function Eu(t){var e=function(){if("undefined"==typeof Reflect||!Ni)return !1;if(Ni.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Ni(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var r,n=$a(t);if(e){var o=$a(this).constructor;r=Ni(n,arguments,o);}else r=n.apply(this,arguments);return Va(this,r)}}var Pu=function(t){za(r,t);var e=Eu(r);function r(t,n){var o,i;return fe(this,r),(i=e.call(this)).length=0,i._ids=new yu,i._options=n||{},i._listener=se(o=i._onEvent).call(o,Ua(i)),i.setData(t),i}return ve(r,[{key:"setData",value:function(t){if(this._data){this._data.off&&this._data.off("*",this._listener);var e=this._data.getIds({filter:Wt(this._options)}),r=this._data.get(e);this._ids.clear(),this.length=0,this._trigger("remove",{items:e,oldData:r});}if(null!=t){this._data=t;for(var n=this._data.getIds({filter:Wt(this._options)}),o=0,i=n.length;o<i;o++){var a=n[o];this._ids.add(a);}this.length=n.length,this._trigger("add",{items:n});}else this._data=new ku;this._data.on&&this._data.on("*",this._listener);}},{key:"refresh",value:function(){for(var t=this._data.getIds({filter:Wt(this._options)}),e=Oi(this._ids),r={},n=[],o=[],i=[],a=0,u=t.length;a<u;a++){var c=t[a];r[c]=!0,this._ids.has(c)||(n.push(c),this._ids.add(c));}for(var s=0,f=e.length;s<f;s++){var l=e[s],h=this._data.get(l);null==h?console.error("If you see this, report it please."):r[l]||(o.push(l),i.push(h),this._ids.delete(l));}this.length+=n.length-o.length,n.length&&this._trigger("add",{items:n}),o.length&&this._trigger("remove",{items:o,oldData:i});}},{key:"get",value:function(t,e){if(null==this._data)return null;var r,n=null;tu(t)||pi(t)?(n=t,r=e):r=t;var o=Mo({},this._options,r),i=Wt(this._options),a=r&&Wt(r);return i&&a&&(o.filter=function(t){return i(t)&&a(t)}),null==n?this._data.get(o):this._data.get(n,o)}},{key:"getIds",value:function(t){if(this._data.length){var e,r=Wt(this._options),n=null!=t?Wt(t):null;return e=n?r?function(t){return r(t)&&n(t)}:n:r,this._data.getIds({filter:e,order:t&&t.order})}return []}},{key:"forEach",value:function(t,e){if(this._data){var r,n,o=Wt(this._options),i=e&&Wt(e);n=i?o?function(t){return o(t)&&i(t)}:i:o,mo(r=this._data).call(r,t,{filter:n,order:e&&e.order});}}},{key:"map",value:function(t,e){if(this._data){var r,n,o=Wt(this._options),i=e&&Wt(e);return n=i?o?function(t){return o(t)&&i(t)}:i:o,Gt(r=this._data).call(r,t,{filter:n,order:e&&e.order})}return []}},{key:"getDataSet",value:function(){return this._data.getDataSet()}},{key:"stream",value:function(t){var e;return this._data.stream(t||ro({},Ji,se(e=pa(this._ids)).call(e,this._ids)))}},{key:"dispose",value:function(){var t;(null===(t=this._data)||void 0===t?void 0:t.off)&&this._data.off("*",this._listener);var e,n="This data view has already been disposed of.",o={get:function(){throw new Error(n)},set:function(){throw new Error(n)},configurable:!1},i=ju(gi(r.prototype));try{for(i.s();!(e=i.n()).done;){var a=e.value;ge(this,a,o);}}catch(t){i.e(t);}finally{i.f();}}},{key:"_onEvent",value:function(t,e,r){if(e&&e.items&&this._data){var n=e.items,o=[],i=[],a=[],u=[],c=[],s=[];switch(t){case"add":for(var f=0,l=n.length;f<l;f++){var h=n[f];this.get(h)&&(this._ids.add(h),o.push(h));}break;case"update":for(var p=0,v=n.length;p<v;p++){var d=n[p];this.get(d)?this._ids.has(d)?(i.push(d),c.push(e.data[p]),u.push(e.oldData[p])):(this._ids.add(d),o.push(d)):this._ids.has(d)&&(this._ids.delete(d),a.push(d),s.push(e.oldData[p]));}break;case"remove":for(var y=0,g=n.length;y<g;y++){var m=n[y];this._ids.has(m)&&(this._ids.delete(m),a.push(m),s.push(e.oldData[y]));}}this.length+=o.length-a.length,o.length&&this._trigger("add",{items:o},r),i.length&&this._trigger("update",{items:i,oldData:u,data:c},r),a.length&&this._trigger("remove",{items:a,oldData:s},r);}}},{key:"idProp",get:function(){return this.getDataSet().idProp}}]),r}(du);function Iu(t,e){return "object"===yi(e)&&null!==e&&t===e.idProp&&"function"==typeof e.add&&"function"==typeof e.clear&&"function"==typeof e.distinct&&"function"==typeof mo(e)&&"function"==typeof e.get&&"function"==typeof e.getDataSet&&"function"==typeof e.getIds&&"number"==typeof e.length&&"function"==typeof Gt(e)&&"function"==typeof e.max&&"function"==typeof e.min&&"function"==typeof e.off&&"function"==typeof e.on&&"function"==typeof e.remove&&"function"==typeof e.setOptions&&"function"==typeof e.stream&&"function"==typeof e.update&&"function"==typeof e.updateOnly}t.DELETE=Pi,t.DataSet=ku,t.DataStream=bu,t.DataView=Pu,t.Queue=vu,t.createNewDataPipeFrom=function(t){return new ye(t)},t.isDataSetLike=Iu,t.isDataViewLike=function(t,e){return "object"===yi(e)&&null!==e&&t===e.idProp&&"function"==typeof mo(e)&&"function"==typeof e.get&&"function"==typeof e.getDataSet&&"function"==typeof e.getIds&&"number"==typeof e.length&&"function"==typeof Gt(e)&&"function"==typeof e.off&&"function"==typeof e.on&&"function"==typeof e.stream&&Iu(t,e.getDataSet())},Object.defineProperty(t,"__esModule",{value:!0});}));

    });

    var visData = createCommonjsModule(function (module, exports) {
    /**
     * vis-data
     * http://visjs.org/
     *
     * Manage unstructured data using DataSet. Add, update, and remove data, and listen for changes in the data.
     *
     * @version 7.1.1
     * @date    2020-11-15T19:08:22.864Z
     *
     * @copyright (c) 2011-2017 Almende B.V, http://almende.com
     * @copyright (c) 2017-2019 visjs contributors, https://github.com/visjs
     *
     * @license
     * vis.js is dual licensed under both
     *
     *   1. The Apache 2.0 License
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     *   and
     *
     *   2. The MIT License
     *      http://opensource.org/licenses/MIT
     *
     * vis.js may be distributed under either license.
     */

    (function (global, factory) {
    	 factory(exports) ;
    }(commonjsGlobal, (function (exports) {
    	var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof self !== 'undefined' ? self : {};

    	function createCommonjsModule(fn, basedir, module) {
    		return module = {
    			path: basedir,
    			exports: {},
    			require: function (path, base) {
    				return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    			}
    		}, fn(module, module.exports), module.exports;
    	}

    	function commonjsRequire () {
    		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    	}

    	var check = function (it) {
    	  return it && it.Math == Math && it;
    	}; // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028


    	var global_1 = // eslint-disable-next-line no-undef
    	check(typeof globalThis == 'object' && globalThis) || check(typeof window == 'object' && window) || check(typeof self == 'object' && self) || check(typeof commonjsGlobal$1 == 'object' && commonjsGlobal$1) || // eslint-disable-next-line no-new-func
    	function () {
    	  return this;
    	}() || Function('return this')();

    	var fails = function (exec) {
    	  try {
    	    return !!exec();
    	  } catch (error) {
    	    return true;
    	  }
    	};

    	var descriptors = !fails(function () {
    	  return Object.defineProperty({}, 1, {
    	    get: function () {
    	      return 7;
    	    }
    	  })[1] != 7;
    	});

    	var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
    	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor; // Nashorn ~ JDK8 bug

    	var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({
    	  1: 2
    	}, 1); // `Object.prototype.propertyIsEnumerable` method implementation
    	// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable

    	var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
    	  var descriptor = getOwnPropertyDescriptor(this, V);
    	  return !!descriptor && descriptor.enumerable;
    	} : nativePropertyIsEnumerable;
    	var objectPropertyIsEnumerable = {
    	  f: f
    	};

    	var createPropertyDescriptor = function (bitmap, value) {
    	  return {
    	    enumerable: !(bitmap & 1),
    	    configurable: !(bitmap & 2),
    	    writable: !(bitmap & 4),
    	    value: value
    	  };
    	};

    	var toString = {}.toString;

    	var classofRaw = function (it) {
    	  return toString.call(it).slice(8, -1);
    	};

    	var split = ''.split; // fallback for non-array-like ES3 and non-enumerable old V8 strings

    	var indexedObject = fails(function () {
    	  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
    	  // eslint-disable-next-line no-prototype-builtins
    	  return !Object('z').propertyIsEnumerable(0);
    	}) ? function (it) {
    	  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
    	} : Object;

    	// `RequireObjectCoercible` abstract operation
    	// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
    	var requireObjectCoercible = function (it) {
    	  if (it == undefined) throw TypeError("Can't call method on " + it);
    	  return it;
    	};

    	var toIndexedObject = function (it) {
    	  return indexedObject(requireObjectCoercible(it));
    	};

    	var isObject = function (it) {
    	  return typeof it === 'object' ? it !== null : typeof it === 'function';
    	};

    	// https://tc39.github.io/ecma262/#sec-toprimitive
    	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
    	// and the second argument - flag - preferred type is a string

    	var toPrimitive = function (input, PREFERRED_STRING) {
    	  if (!isObject(input)) return input;
    	  var fn, val;
    	  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    	  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
    	  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    	  throw TypeError("Can't convert object to primitive value");
    	};

    	var hasOwnProperty = {}.hasOwnProperty;

    	var has = function (it, key) {
    	  return hasOwnProperty.call(it, key);
    	};

    	var document$1 = global_1.document; // typeof document.createElement is 'object' in old IE

    	var EXISTS = isObject(document$1) && isObject(document$1.createElement);

    	var documentCreateElement = function (it) {
    	  return EXISTS ? document$1.createElement(it) : {};
    	};

    	var ie8DomDefine = !descriptors && !fails(function () {
    	  return Object.defineProperty(documentCreateElement('div'), 'a', {
    	    get: function () {
    	      return 7;
    	    }
    	  }).a != 7;
    	});

    	var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor; // `Object.getOwnPropertyDescriptor` method
    	// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor

    	var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
    	  O = toIndexedObject(O);
    	  P = toPrimitive(P, true);
    	  if (ie8DomDefine) try {
    	    return nativeGetOwnPropertyDescriptor(O, P);
    	  } catch (error) {
    	    /* empty */
    	  }
    	  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
    	};
    	var objectGetOwnPropertyDescriptor = {
    	  f: f$1
    	};

    	var replacement = /#|\.prototype\./;

    	var isForced = function (feature, detection) {
    	  var value = data[normalize(feature)];
    	  return value == POLYFILL ? true : value == NATIVE ? false : typeof detection == 'function' ? fails(detection) : !!detection;
    	};

    	var normalize = isForced.normalize = function (string) {
    	  return String(string).replace(replacement, '.').toLowerCase();
    	};

    	var data = isForced.data = {};
    	var NATIVE = isForced.NATIVE = 'N';
    	var POLYFILL = isForced.POLYFILL = 'P';
    	var isForced_1 = isForced;

    	var path = {};

    	var aFunction = function (it) {
    	  if (typeof it != 'function') {
    	    throw TypeError(String(it) + ' is not a function');
    	  }

    	  return it;
    	};

    	var functionBindContext = function (fn, that, length) {
    	  aFunction(fn);
    	  if (that === undefined) return fn;

    	  switch (length) {
    	    case 0:
    	      return function () {
    	        return fn.call(that);
    	      };

    	    case 1:
    	      return function (a) {
    	        return fn.call(that, a);
    	      };

    	    case 2:
    	      return function (a, b) {
    	        return fn.call(that, a, b);
    	      };

    	    case 3:
    	      return function (a, b, c) {
    	        return fn.call(that, a, b, c);
    	      };
    	  }

    	  return function ()
    	  /* ...args */
    	  {
    	    return fn.apply(that, arguments);
    	  };
    	};

    	var anObject = function (it) {
    	  if (!isObject(it)) {
    	    throw TypeError(String(it) + ' is not an object');
    	  }

    	  return it;
    	};

    	var nativeDefineProperty = Object.defineProperty; // `Object.defineProperty` method
    	// https://tc39.github.io/ecma262/#sec-object.defineproperty

    	var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
    	  anObject(O);
    	  P = toPrimitive(P, true);
    	  anObject(Attributes);
    	  if (ie8DomDefine) try {
    	    return nativeDefineProperty(O, P, Attributes);
    	  } catch (error) {
    	    /* empty */
    	  }
    	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
    	  if ('value' in Attributes) O[P] = Attributes.value;
    	  return O;
    	};
    	var objectDefineProperty = {
    	  f: f$2
    	};

    	var createNonEnumerableProperty = descriptors ? function (object, key, value) {
    	  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
    	} : function (object, key, value) {
    	  object[key] = value;
    	  return object;
    	};

    	var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;

    	var wrapConstructor = function (NativeConstructor) {
    	  var Wrapper = function (a, b, c) {
    	    if (this instanceof NativeConstructor) {
    	      switch (arguments.length) {
    	        case 0:
    	          return new NativeConstructor();

    	        case 1:
    	          return new NativeConstructor(a);

    	        case 2:
    	          return new NativeConstructor(a, b);
    	      }

    	      return new NativeConstructor(a, b, c);
    	    }

    	    return NativeConstructor.apply(this, arguments);
    	  };

    	  Wrapper.prototype = NativeConstructor.prototype;
    	  return Wrapper;
    	};
    	/*
    	  options.target      - name of the target object
    	  options.global      - target is the global object
    	  options.stat        - export as static methods of target
    	  options.proto       - export as prototype methods of target
    	  options.real        - real prototype method for the `pure` version
    	  options.forced      - export even if the native feature is available
    	  options.bind        - bind methods to the target, required for the `pure` version
    	  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
    	  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
    	  options.sham        - add a flag to not completely full polyfills
    	  options.enumerable  - export as enumerable property
    	  options.noTargetGet - prevent calling a getter on target
    	*/


    	var _export = function (options, source) {
    	  var TARGET = options.target;
    	  var GLOBAL = options.global;
    	  var STATIC = options.stat;
    	  var PROTO = options.proto;
    	  var nativeSource = GLOBAL ? global_1 : STATIC ? global_1[TARGET] : (global_1[TARGET] || {}).prototype;
    	  var target = GLOBAL ? path : path[TARGET] || (path[TARGET] = {});
    	  var targetPrototype = target.prototype;
    	  var FORCED, USE_NATIVE, VIRTUAL_PROTOTYPE;
    	  var key, sourceProperty, targetProperty, nativeProperty, resultProperty, descriptor;

    	  for (key in source) {
    	    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced); // contains in native

    	    USE_NATIVE = !FORCED && nativeSource && has(nativeSource, key);
    	    targetProperty = target[key];
    	    if (USE_NATIVE) if (options.noTargetGet) {
    	      descriptor = getOwnPropertyDescriptor$1(nativeSource, key);
    	      nativeProperty = descriptor && descriptor.value;
    	    } else nativeProperty = nativeSource[key]; // export native or implementation

    	    sourceProperty = USE_NATIVE && nativeProperty ? nativeProperty : source[key];
    	    if (USE_NATIVE && typeof targetProperty === typeof sourceProperty) continue; // bind timers to global for call from export context

    	    if (options.bind && USE_NATIVE) resultProperty = functionBindContext(sourceProperty, global_1); // wrap global constructors for prevent changs in this version
    	    else if (options.wrap && USE_NATIVE) resultProperty = wrapConstructor(sourceProperty); // make static versions for prototype methods
    	      else if (PROTO && typeof sourceProperty == 'function') resultProperty = functionBindContext(Function.call, sourceProperty); // default case
    	        else resultProperty = sourceProperty; // add a flag to not completely full polyfills

    	    if (options.sham || sourceProperty && sourceProperty.sham || targetProperty && targetProperty.sham) {
    	      createNonEnumerableProperty(resultProperty, 'sham', true);
    	    }

    	    target[key] = resultProperty;

    	    if (PROTO) {
    	      VIRTUAL_PROTOTYPE = TARGET + 'Prototype';

    	      if (!has(path, VIRTUAL_PROTOTYPE)) {
    	        createNonEnumerableProperty(path, VIRTUAL_PROTOTYPE, {});
    	      } // export virtual prototype methods


    	      path[VIRTUAL_PROTOTYPE][key] = sourceProperty; // export real prototype methods

    	      if (options.real && targetPrototype && !targetPrototype[key]) {
    	        createNonEnumerableProperty(targetPrototype, key, sourceProperty);
    	      }
    	    }
    	  }
    	};

    	// https://tc39.github.io/ecma262/#sec-isarray

    	var isArray = Array.isArray || function isArray(arg) {
    	  return classofRaw(arg) == 'Array';
    	};

    	var ceil = Math.ceil;
    	var floor = Math.floor; // `ToInteger` abstract operation
    	// https://tc39.github.io/ecma262/#sec-tointeger

    	var toInteger = function (argument) {
    	  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
    	};

    	var min = Math.min; // `ToLength` abstract operation
    	// https://tc39.github.io/ecma262/#sec-tolength

    	var toLength = function (argument) {
    	  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
    	};

    	// https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray


    	var flattenIntoArray = function (target, original, source, sourceLen, start, depth, mapper, thisArg) {
    	  var targetIndex = start;
    	  var sourceIndex = 0;
    	  var mapFn = mapper ? functionBindContext(mapper, thisArg, 3) : false;
    	  var element;

    	  while (sourceIndex < sourceLen) {
    	    if (sourceIndex in source) {
    	      element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

    	      if (depth > 0 && isArray(element)) {
    	        targetIndex = flattenIntoArray(target, original, element, toLength(element.length), targetIndex, depth - 1) - 1;
    	      } else {
    	        if (targetIndex >= 0x1FFFFFFFFFFFFF) throw TypeError('Exceed the acceptable array length');
    	        target[targetIndex] = element;
    	      }

    	      targetIndex++;
    	    }

    	    sourceIndex++;
    	  }

    	  return targetIndex;
    	};

    	var flattenIntoArray_1 = flattenIntoArray;

    	// https://tc39.github.io/ecma262/#sec-toobject

    	var toObject = function (argument) {
    	  return Object(requireObjectCoercible(argument));
    	};

    	var setGlobal = function (key, value) {
    	  try {
    	    createNonEnumerableProperty(global_1, key, value);
    	  } catch (error) {
    	    global_1[key] = value;
    	  }

    	  return value;
    	};

    	var SHARED = '__core-js_shared__';
    	var store = global_1[SHARED] || setGlobal(SHARED, {});
    	var sharedStore = store;

    	var shared = createCommonjsModule(function (module) {
    	  (module.exports = function (key, value) {
    	    return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
    	  })('versions', []).push({
    	    version: '3.7.0',
    	    mode:  'pure' ,
    	    copyright: '© 2020 Denis Pushkarev (zloirock.ru)'
    	  });
    	});

    	var id = 0;
    	var postfix = Math.random();

    	var uid = function (key) {
    	  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
    	};

    	var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
    	  // Chrome 38 Symbol has incorrect toString conversion
    	  // eslint-disable-next-line no-undef
    	  return !String(Symbol());
    	});

    	var useSymbolAsUid = nativeSymbol // eslint-disable-next-line no-undef
    	&& !Symbol.sham // eslint-disable-next-line no-undef
    	&& typeof Symbol.iterator == 'symbol';

    	var WellKnownSymbolsStore = shared('wks');
    	var Symbol$1 = global_1.Symbol;
    	var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid;

    	var wellKnownSymbol = function (name) {
    	  if (!has(WellKnownSymbolsStore, name)) {
    	    if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    	  }

    	  return WellKnownSymbolsStore[name];
    	};

    	var SPECIES = wellKnownSymbol('species'); // `ArraySpeciesCreate` abstract operation
    	// https://tc39.github.io/ecma262/#sec-arrayspeciescreate

    	var arraySpeciesCreate = function (originalArray, length) {
    	  var C;

    	  if (isArray(originalArray)) {
    	    C = originalArray.constructor; // cross-realm fallback

    	    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;else if (isObject(C)) {
    	      C = C[SPECIES];
    	      if (C === null) C = undefined;
    	    }
    	  }

    	  return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
    	};

    	// https://github.com/tc39/proposal-flatMap


    	_export({
    	  target: 'Array',
    	  proto: true
    	}, {
    	  flatMap: function flatMap(callbackfn
    	  /* , thisArg */
    	  ) {
    	    var O = toObject(this);
    	    var sourceLen = toLength(O.length);
    	    var A;
    	    aFunction(callbackfn);
    	    A = arraySpeciesCreate(O, 0);
    	    A.length = flattenIntoArray_1(A, O, O, sourceLen, 0, 1, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    	    return A;
    	  }
    	});

    	var entryVirtual = function (CONSTRUCTOR) {
    	  return path[CONSTRUCTOR + 'Prototype'];
    	};

    	var flatMap = entryVirtual('Array').flatMap;

    	var ArrayPrototype = Array.prototype;

    	var flatMap_1 = function (it) {
    	  var own = it.flatMap;
    	  return it === ArrayPrototype || it instanceof Array && own === ArrayPrototype.flatMap ? flatMap : own;
    	};

    	var flatMap$1 = flatMap_1;

    	var flatMap$2 = flatMap$1;

    	var push = [].push; // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation

    	var createMethod = function (TYPE) {
    	  var IS_MAP = TYPE == 1;
    	  var IS_FILTER = TYPE == 2;
    	  var IS_SOME = TYPE == 3;
    	  var IS_EVERY = TYPE == 4;
    	  var IS_FIND_INDEX = TYPE == 6;
    	  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
    	  return function ($this, callbackfn, that, specificCreate) {
    	    var O = toObject($this);
    	    var self = indexedObject(O);
    	    var boundFunction = functionBindContext(callbackfn, that, 3);
    	    var length = toLength(self.length);
    	    var index = 0;
    	    var create = specificCreate || arraySpeciesCreate;
    	    var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    	    var value, result;

    	    for (; length > index; index++) if (NO_HOLES || index in self) {
    	      value = self[index];
    	      result = boundFunction(value, index, O);

    	      if (TYPE) {
    	        if (IS_MAP) target[index] = result; // map
    	        else if (result) switch (TYPE) {
    	            case 3:
    	              return true;
    	            // some

    	            case 5:
    	              return value;
    	            // find

    	            case 6:
    	              return index;
    	            // findIndex

    	            case 2:
    	              push.call(target, value);
    	            // filter
    	          } else if (IS_EVERY) return false; // every
    	      }
    	    }

    	    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
    	  };
    	};

    	var arrayIteration = {
    	  // `Array.prototype.forEach` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
    	  forEach: createMethod(0),
    	  // `Array.prototype.map` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.map
    	  map: createMethod(1),
    	  // `Array.prototype.filter` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
    	  filter: createMethod(2),
    	  // `Array.prototype.some` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.some
    	  some: createMethod(3),
    	  // `Array.prototype.every` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.every
    	  every: createMethod(4),
    	  // `Array.prototype.find` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.find
    	  find: createMethod(5),
    	  // `Array.prototype.findIndex` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
    	  findIndex: createMethod(6)
    	};

    	var aFunction$1 = function (variable) {
    	  return typeof variable == 'function' ? variable : undefined;
    	};

    	var getBuiltIn = function (namespace, method) {
    	  return arguments.length < 2 ? aFunction$1(path[namespace]) || aFunction$1(global_1[namespace]) : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
    	};

    	var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

    	var process = global_1.process;
    	var versions = process && process.versions;
    	var v8 = versions && versions.v8;
    	var match, version;

    	if (v8) {
    	  match = v8.split('.');
    	  version = match[0] + match[1];
    	} else if (engineUserAgent) {
    	  match = engineUserAgent.match(/Edge\/(\d+)/);

    	  if (!match || match[1] >= 74) {
    	    match = engineUserAgent.match(/Chrome\/(\d+)/);
    	    if (match) version = match[1];
    	  }
    	}

    	var engineV8Version = version && +version;

    	var SPECIES$1 = wellKnownSymbol('species');

    	var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
    	  // We can't use this feature detection in V8 since it causes
    	  // deoptimization and serious performance degradation
    	  // https://github.com/zloirock/core-js/issues/677
    	  return engineV8Version >= 51 || !fails(function () {
    	    var array = [];
    	    var constructor = array.constructor = {};

    	    constructor[SPECIES$1] = function () {
    	      return {
    	        foo: 1
    	      };
    	    };

    	    return array[METHOD_NAME](Boolean).foo !== 1;
    	  });
    	};

    	var defineProperty = Object.defineProperty;
    	var cache = {};

    	var thrower = function (it) {
    	  throw it;
    	};

    	var arrayMethodUsesToLength = function (METHOD_NAME, options) {
    	  if (has(cache, METHOD_NAME)) return cache[METHOD_NAME];
    	  if (!options) options = {};
    	  var method = [][METHOD_NAME];
    	  var ACCESSORS = has(options, 'ACCESSORS') ? options.ACCESSORS : false;
    	  var argument0 = has(options, 0) ? options[0] : thrower;
    	  var argument1 = has(options, 1) ? options[1] : undefined;
    	  return cache[METHOD_NAME] = !!method && !fails(function () {
    	    if (ACCESSORS && !descriptors) return true;
    	    var O = {
    	      length: -1
    	    };
    	    if (ACCESSORS) defineProperty(O, 1, {
    	      enumerable: true,
    	      get: thrower
    	    });else O[1] = 1;
    	    method.call(O, argument0, argument1);
    	  });
    	};

    	var $map = arrayIteration.map;
    	var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map'); // FF49- issue

    	var USES_TO_LENGTH = arrayMethodUsesToLength('map'); // `Array.prototype.map` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.map
    	// with adding support of @@species

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH
    	}, {
    	  map: function map(callbackfn
    	  /* , thisArg */
    	  ) {
    	    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    	  }
    	});

    	var map = entryVirtual('Array').map;

    	var ArrayPrototype$1 = Array.prototype;

    	var map_1 = function (it) {
    	  var own = it.map;
    	  return it === ArrayPrototype$1 || it instanceof Array && own === ArrayPrototype$1.map ? map : own;
    	};

    	var map$1 = map_1;

    	var map$2 = map$1;

    	var $filter = arrayIteration.filter;
    	var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('filter'); // Edge 14- issue

    	var USES_TO_LENGTH$1 = arrayMethodUsesToLength('filter'); // `Array.prototype.filter` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.filter
    	// with adding support of @@species

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$1
    	}, {
    	  filter: function filter(callbackfn
    	  /* , thisArg */
    	  ) {
    	    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    	  }
    	});

    	var filter = entryVirtual('Array').filter;

    	var ArrayPrototype$2 = Array.prototype;

    	var filter_1 = function (it) {
    	  var own = it.filter;
    	  return it === ArrayPrototype$2 || it instanceof Array && own === ArrayPrototype$2.filter ? filter : own;
    	};

    	var filter$1 = filter_1;

    	var filter$2 = filter$1;

    	var createMethod$1 = function (IS_RIGHT) {
    	  return function (that, callbackfn, argumentsLength, memo) {
    	    aFunction(callbackfn);
    	    var O = toObject(that);
    	    var self = indexedObject(O);
    	    var length = toLength(O.length);
    	    var index = IS_RIGHT ? length - 1 : 0;
    	    var i = IS_RIGHT ? -1 : 1;
    	    if (argumentsLength < 2) while (true) {
    	      if (index in self) {
    	        memo = self[index];
    	        index += i;
    	        break;
    	      }

    	      index += i;

    	      if (IS_RIGHT ? index < 0 : length <= index) {
    	        throw TypeError('Reduce of empty array with no initial value');
    	      }
    	    }

    	    for (; IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
    	      memo = callbackfn(memo, self[index], index, O);
    	    }

    	    return memo;
    	  };
    	};

    	var arrayReduce = {
    	  // `Array.prototype.reduce` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
    	  left: createMethod$1(false),
    	  // `Array.prototype.reduceRight` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
    	  right: createMethod$1(true)
    	};

    	var arrayMethodIsStrict = function (METHOD_NAME, argument) {
    	  var method = [][METHOD_NAME];
    	  return !!method && fails(function () {
    	    // eslint-disable-next-line no-useless-call,no-throw-literal
    	    method.call(null, argument || function () {
    	      throw 1;
    	    }, 1);
    	  });
    	};

    	var engineIsNode = classofRaw(global_1.process) == 'process';

    	var $reduce = arrayReduce.left;
    	var STRICT_METHOD = arrayMethodIsStrict('reduce');
    	var USES_TO_LENGTH$2 = arrayMethodUsesToLength('reduce', {
    	  1: 0
    	}); // Chrome 80-82 has a critical bug
    	// https://bugs.chromium.org/p/chromium/issues/detail?id=1049982

    	var CHROME_BUG = !engineIsNode && engineV8Version > 79 && engineV8Version < 83; // `Array.prototype.reduce` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.reduce

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: !STRICT_METHOD || !USES_TO_LENGTH$2 || CHROME_BUG
    	}, {
    	  reduce: function reduce(callbackfn
    	  /* , initialValue */
    	  ) {
    	    return $reduce(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
    	  }
    	});

    	var reduce = entryVirtual('Array').reduce;

    	var ArrayPrototype$3 = Array.prototype;

    	var reduce_1 = function (it) {
    	  var own = it.reduce;
    	  return it === ArrayPrototype$3 || it instanceof Array && own === ArrayPrototype$3.reduce ? reduce : own;
    	};

    	var reduce$1 = reduce_1;

    	var reduce$2 = reduce$1;

    	var slice = [].slice;
    	var factories = {};

    	var construct = function (C, argsLength, args) {
    	  if (!(argsLength in factories)) {
    	    for (var list = [], i = 0; i < argsLength; i++) list[i] = 'a[' + i + ']'; // eslint-disable-next-line no-new-func


    	    factories[argsLength] = Function('C,a', 'return new C(' + list.join(',') + ')');
    	  }

    	  return factories[argsLength](C, args);
    	}; // `Function.prototype.bind` method implementation
    	// https://tc39.github.io/ecma262/#sec-function.prototype.bind


    	var functionBind = Function.bind || function bind(that
    	/* , ...args */
    	) {
    	  var fn = aFunction(this);
    	  var partArgs = slice.call(arguments, 1);

    	  var boundFunction = function bound()
    	  /* args... */
    	  {
    	    var args = partArgs.concat(slice.call(arguments));
    	    return this instanceof boundFunction ? construct(fn, args.length, args) : fn.apply(that, args);
    	  };

    	  if (isObject(fn.prototype)) boundFunction.prototype = fn.prototype;
    	  return boundFunction;
    	};

    	// https://tc39.github.io/ecma262/#sec-function.prototype.bind

    	_export({
    	  target: 'Function',
    	  proto: true
    	}, {
    	  bind: functionBind
    	});

    	var bind = entryVirtual('Function').bind;

    	var FunctionPrototype = Function.prototype;

    	var bind_1 = function (it) {
    	  var own = it.bind;
    	  return it === FunctionPrototype || it instanceof Function && own === FunctionPrototype.bind ? bind : own;
    	};

    	var bind$1 = bind_1;

    	var bind$2 = bind$1;

    	function _classCallCheck(instance, Constructor) {
    	  if (!(instance instanceof Constructor)) {
    	    throw new TypeError("Cannot call a class as a function");
    	  }
    	}

    	var classCallCheck = _classCallCheck;

    	// https://tc39.github.io/ecma262/#sec-object.defineproperty

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: !descriptors,
    	  sham: !descriptors
    	}, {
    	  defineProperty: objectDefineProperty.f
    	});

    	var defineProperty_1 = createCommonjsModule(function (module) {
    	  var Object = path.Object;

    	  var defineProperty = module.exports = function defineProperty(it, key, desc) {
    	    return Object.defineProperty(it, key, desc);
    	  };

    	  if (Object.defineProperty.sham) defineProperty.sham = true;
    	});

    	var defineProperty$1 = defineProperty_1;

    	var defineProperty$2 = defineProperty$1;

    	function _defineProperties(target, props) {
    	  for (var i = 0; i < props.length; i++) {
    	    var descriptor = props[i];
    	    descriptor.enumerable = descriptor.enumerable || false;
    	    descriptor.configurable = true;
    	    if ("value" in descriptor) descriptor.writable = true;

    	    defineProperty$2(target, descriptor.key, descriptor);
    	  }
    	}

    	function _createClass(Constructor, protoProps, staticProps) {
    	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    	  if (staticProps) _defineProperties(Constructor, staticProps);
    	  return Constructor;
    	}

    	var createClass = _createClass;

    	/**
    	 * Create new data pipe.
    	 *
    	 * @param from - The source data set or data view.
    	 *
    	 * @remarks
    	 * Example usage:
    	 * ```typescript
    	 * interface AppItem {
    	 *   whoami: string;
    	 *   appData: unknown;
    	 *   visData: VisItem;
    	 * }
    	 * interface VisItem {
    	 *   id: number;
    	 *   label: string;
    	 *   color: string;
    	 *   x: number;
    	 *   y: number;
    	 * }
    	 *
    	 * const ds1 = new DataSet<AppItem, "whoami">([], { fieldId: "whoami" });
    	 * const ds2 = new DataSet<VisItem, "id">();
    	 *
    	 * const pipe = createNewDataPipeFrom(ds1)
    	 *   .filter((item): boolean => item.enabled === true)
    	 *   .map<VisItem, "id">((item): VisItem => item.visData)
    	 *   .to(ds2);
    	 *
    	 * pipe.start();
    	 * ```
    	 *
    	 * @returns A factory whose methods can be used to configure the pipe.
    	 */
    	function createNewDataPipeFrom(from) {
    	  return new DataPipeUnderConstruction(from);
    	}
    	/**
    	 * Internal implementation of the pipe. This should be accessible only through
    	 * `createNewDataPipeFrom` from the outside.
    	 *
    	 * @typeParam SI - Source item type.
    	 * @typeParam SP - Source item type's id property name.
    	 * @typeParam TI - Target item type.
    	 * @typeParam TP - Target item type's id property name.
    	 */

    	var SimpleDataPipe = /*#__PURE__*/function () {
    	  /**
    	   * Create a new data pipe.
    	   *
    	   * @param _source - The data set or data view that will be observed.
    	   * @param _transformers - An array of transforming functions to be used to
    	   * filter or transform the items in the pipe.
    	   * @param _target - The data set or data view that will receive the items.
    	   */
    	  function SimpleDataPipe(_source, _transformers, _target) {
    	    var _context, _context2, _context3;

    	    classCallCheck(this, SimpleDataPipe);

    	    this._source = _source;
    	    this._transformers = _transformers;
    	    this._target = _target;
    	    /**
    	     * Bound listeners for use with `DataInterface['on' | 'off']`.
    	     */

    	    this._listeners = {
    	      add: bind$2(_context = this._add).call(_context, this),
    	      remove: bind$2(_context2 = this._remove).call(_context2, this),
    	      update: bind$2(_context3 = this._update).call(_context3, this)
    	    };
    	  }
    	  /** @inheritDoc */


    	  createClass(SimpleDataPipe, [{
    	    key: "all",
    	    value: function all() {
    	      this._target.update(this._transformItems(this._source.get()));

    	      return this;
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "start",
    	    value: function start() {
    	      this._source.on("add", this._listeners.add);

    	      this._source.on("remove", this._listeners.remove);

    	      this._source.on("update", this._listeners.update);

    	      return this;
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "stop",
    	    value: function stop() {
    	      this._source.off("add", this._listeners.add);

    	      this._source.off("remove", this._listeners.remove);

    	      this._source.off("update", this._listeners.update);

    	      return this;
    	    }
    	    /**
    	     * Apply the transformers to the items.
    	     *
    	     * @param items - The items to be transformed.
    	     *
    	     * @returns The transformed items.
    	     */

    	  }, {
    	    key: "_transformItems",
    	    value: function _transformItems(items) {
    	      var _context4;

    	      return reduce$2(_context4 = this._transformers).call(_context4, function (items, transform) {
    	        return transform(items);
    	      }, items);
    	    }
    	    /**
    	     * Handle an add event.
    	     *
    	     * @param _name - Ignored.
    	     * @param payload - The payload containing the ids of the added items.
    	     */

    	  }, {
    	    key: "_add",
    	    value: function _add(_name, payload) {
    	      if (payload == null) {
    	        return;
    	      }

    	      this._target.add(this._transformItems(this._source.get(payload.items)));
    	    }
    	    /**
    	     * Handle an update event.
    	     *
    	     * @param _name - Ignored.
    	     * @param payload - The payload containing the ids of the updated items.
    	     */

    	  }, {
    	    key: "_update",
    	    value: function _update(_name, payload) {
    	      if (payload == null) {
    	        return;
    	      }

    	      this._target.update(this._transformItems(this._source.get(payload.items)));
    	    }
    	    /**
    	     * Handle a remove event.
    	     *
    	     * @param _name - Ignored.
    	     * @param payload - The payload containing the data of the removed items.
    	     */

    	  }, {
    	    key: "_remove",
    	    value: function _remove(_name, payload) {
    	      if (payload == null) {
    	        return;
    	      }

    	      this._target.remove(this._transformItems(payload.oldData));
    	    }
    	  }]);

    	  return SimpleDataPipe;
    	}();
    	/**
    	 * Internal implementation of the pipe factory. This should be accessible
    	 * only through `createNewDataPipeFrom` from the outside.
    	 *
    	 * @typeParam TI - Target item type.
    	 * @typeParam TP - Target item type's id property name.
    	 */


    	var DataPipeUnderConstruction = /*#__PURE__*/function () {
    	  /**
    	   * Create a new data pipe factory. This is an internal constructor that
    	   * should never be called from outside of this file.
    	   *
    	   * @param _source - The source data set or data view for this pipe.
    	   */
    	  function DataPipeUnderConstruction(_source) {
    	    classCallCheck(this, DataPipeUnderConstruction);

    	    this._source = _source;
    	    /**
    	     * Array transformers used to transform items within the pipe. This is typed
    	     * as any for the sake of simplicity.
    	     */

    	    this._transformers = [];
    	  }
    	  /**
    	   * Filter the items.
    	   *
    	   * @param callback - A filtering function that returns true if given item
    	   * should be piped and false if not.
    	   *
    	   * @returns This factory for further configuration.
    	   */


    	  createClass(DataPipeUnderConstruction, [{
    	    key: "filter",
    	    value: function filter(callback) {
    	      this._transformers.push(function (input) {
    	        return filter$2(input).call(input, callback);
    	      });

    	      return this;
    	    }
    	    /**
    	     * Map each source item to a new type.
    	     *
    	     * @param callback - A mapping function that takes a source item and returns
    	     * corresponding mapped item.
    	     *
    	     * @typeParam TI - Target item type.
    	     * @typeParam TP - Target item type's id property name.
    	     *
    	     * @returns This factory for further configuration.
    	     */

    	  }, {
    	    key: "map",
    	    value: function map(callback) {
    	      this._transformers.push(function (input) {
    	        return map$2(input).call(input, callback);
    	      });

    	      return this;
    	    }
    	    /**
    	     * Map each source item to zero or more items of a new type.
    	     *
    	     * @param callback - A mapping function that takes a source item and returns
    	     * an array of corresponding mapped items.
    	     *
    	     * @typeParam TI - Target item type.
    	     * @typeParam TP - Target item type's id property name.
    	     *
    	     * @returns This factory for further configuration.
    	     */

    	  }, {
    	    key: "flatMap",
    	    value: function flatMap(callback) {
    	      this._transformers.push(function (input) {
    	        return flatMap$2(input).call(input, callback);
    	      });

    	      return this;
    	    }
    	    /**
    	     * Connect this pipe to given data set.
    	     *
    	     * @param target - The data set that will receive the items from this pipe.
    	     *
    	     * @returns The pipe connected between given data sets and performing
    	     * configured transformation on the processed items.
    	     */

    	  }, {
    	    key: "to",
    	    value: function to(target) {
    	      return new SimpleDataPipe(this._source, this._transformers, target);
    	    }
    	  }]);

    	  return DataPipeUnderConstruction;
    	}();

    	var defineProperty$3 = defineProperty_1;

    	var defineProperty$4 = defineProperty$3;

    	var max = Math.max;
    	var min$1 = Math.min; // Helper for a popular repeating case of the spec:
    	// Let integer be ? ToInteger(index).
    	// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).

    	var toAbsoluteIndex = function (index, length) {
    	  var integer = toInteger(index);
    	  return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
    	};

    	var createMethod$2 = function (IS_INCLUDES) {
    	  return function ($this, el, fromIndex) {
    	    var O = toIndexedObject($this);
    	    var length = toLength(O.length);
    	    var index = toAbsoluteIndex(fromIndex, length);
    	    var value; // Array#includes uses SameValueZero equality algorithm
    	    // eslint-disable-next-line no-self-compare

    	    if (IS_INCLUDES && el != el) while (length > index) {
    	      value = O[index++]; // eslint-disable-next-line no-self-compare

    	      if (value != value) return true; // Array#indexOf ignores holes, Array#includes - not
    	    } else for (; length > index; index++) {
    	      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    	    }
    	    return !IS_INCLUDES && -1;
    	  };
    	};

    	var arrayIncludes = {
    	  // `Array.prototype.includes` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
    	  includes: createMethod$2(true),
    	  // `Array.prototype.indexOf` method
    	  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
    	  indexOf: createMethod$2(false)
    	};

    	var hiddenKeys = {};

    	var indexOf = arrayIncludes.indexOf;

    	var objectKeysInternal = function (object, names) {
    	  var O = toIndexedObject(object);
    	  var i = 0;
    	  var result = [];
    	  var key;

    	  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key); // Don't enum bug & hidden keys


    	  while (names.length > i) if (has(O, key = names[i++])) {
    	    ~indexOf(result, key) || result.push(key);
    	  }

    	  return result;
    	};

    	// IE8- don't enum bug keys
    	var enumBugKeys = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];

    	// https://tc39.github.io/ecma262/#sec-object.keys

    	var objectKeys = Object.keys || function keys(O) {
    	  return objectKeysInternal(O, enumBugKeys);
    	};

    	// https://tc39.github.io/ecma262/#sec-object.defineproperties

    	var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
    	  anObject(O);
    	  var keys = objectKeys(Properties);
    	  var length = keys.length;
    	  var index = 0;
    	  var key;

    	  while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);

    	  return O;
    	};

    	// https://tc39.github.io/ecma262/#sec-object.defineproperties

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: !descriptors,
    	  sham: !descriptors
    	}, {
    	  defineProperties: objectDefineProperties
    	});

    	var defineProperties_1 = createCommonjsModule(function (module) {
    	  var Object = path.Object;

    	  var defineProperties = module.exports = function defineProperties(T, D) {
    	    return Object.defineProperties(T, D);
    	  };

    	  if (Object.defineProperties.sham) defineProperties.sham = true;
    	});

    	var defineProperties = defineProperties_1;

    	var defineProperties$1 = defineProperties;

    	var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype'); // `Object.getOwnPropertyNames` method
    	// https://tc39.github.io/ecma262/#sec-object.getownpropertynames

    	var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
    	  return objectKeysInternal(O, hiddenKeys$1);
    	};

    	var objectGetOwnPropertyNames = {
    	  f: f$3
    	};

    	var f$4 = Object.getOwnPropertySymbols;
    	var objectGetOwnPropertySymbols = {
    	  f: f$4
    	};

    	var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
    	  var keys = objectGetOwnPropertyNames.f(anObject(it));
    	  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    	  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
    	};

    	var createProperty = function (object, key, value) {
    	  var propertyKey = toPrimitive(key);
    	  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));else object[propertyKey] = value;
    	};

    	// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  sham: !descriptors
    	}, {
    	  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
    	    var O = toIndexedObject(object);
    	    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
    	    var keys = ownKeys(O);
    	    var result = {};
    	    var index = 0;
    	    var key, descriptor;

    	    while (keys.length > index) {
    	      descriptor = getOwnPropertyDescriptor(O, key = keys[index++]);
    	      if (descriptor !== undefined) createProperty(result, key, descriptor);
    	    }

    	    return result;
    	  }
    	});

    	var getOwnPropertyDescriptors = path.Object.getOwnPropertyDescriptors;

    	var getOwnPropertyDescriptors$1 = getOwnPropertyDescriptors;

    	var getOwnPropertyDescriptors$2 = getOwnPropertyDescriptors$1;

    	var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;
    	var FAILS_ON_PRIMITIVES = fails(function () {
    	  nativeGetOwnPropertyDescriptor$1(1);
    	});
    	var FORCED = !descriptors || FAILS_ON_PRIMITIVES; // `Object.getOwnPropertyDescriptor` method
    	// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: FORCED,
    	  sham: !descriptors
    	}, {
    	  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
    	    return nativeGetOwnPropertyDescriptor$1(toIndexedObject(it), key);
    	  }
    	});

    	var getOwnPropertyDescriptor_1 = createCommonjsModule(function (module) {
    	  var Object = path.Object;

    	  var getOwnPropertyDescriptor = module.exports = function getOwnPropertyDescriptor(it, key) {
    	    return Object.getOwnPropertyDescriptor(it, key);
    	  };

    	  if (Object.getOwnPropertyDescriptor.sham) getOwnPropertyDescriptor.sham = true;
    	});

    	var getOwnPropertyDescriptor$2 = getOwnPropertyDescriptor_1;

    	var getOwnPropertyDescriptor$3 = getOwnPropertyDescriptor$2;

    	var html = getBuiltIn('document', 'documentElement');

    	var keys = shared('keys');

    	var sharedKey = function (key) {
    	  return keys[key] || (keys[key] = uid(key));
    	};

    	var GT = '>';
    	var LT = '<';
    	var PROTOTYPE = 'prototype';
    	var SCRIPT = 'script';
    	var IE_PROTO = sharedKey('IE_PROTO');

    	var EmptyConstructor = function () {
    	  /* empty */
    	};

    	var scriptTag = function (content) {
    	  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
    	}; // Create object with fake `null` prototype: use ActiveX Object with cleared prototype


    	var NullProtoObjectViaActiveX = function (activeXDocument) {
    	  activeXDocument.write(scriptTag(''));
    	  activeXDocument.close();
    	  var temp = activeXDocument.parentWindow.Object;
    	  activeXDocument = null; // avoid memory leak

    	  return temp;
    	}; // Create object with fake `null` prototype: use iframe Object with cleared prototype


    	var NullProtoObjectViaIFrame = function () {
    	  // Thrash, waste and sodomy: IE GC bug
    	  var iframe = documentCreateElement('iframe');
    	  var JS = 'java' + SCRIPT + ':';
    	  var iframeDocument;
    	  iframe.style.display = 'none';
    	  html.appendChild(iframe); // https://github.com/zloirock/core-js/issues/475

    	  iframe.src = String(JS);
    	  iframeDocument = iframe.contentWindow.document;
    	  iframeDocument.open();
    	  iframeDocument.write(scriptTag('document.F=Object'));
    	  iframeDocument.close();
    	  return iframeDocument.F;
    	}; // Check for document.domain and active x support
    	// No need to use active x approach when document.domain is not set
    	// see https://github.com/es-shims/es5-shim/issues/150
    	// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
    	// avoid IE GC bug


    	var activeXDocument;

    	var NullProtoObject = function () {
    	  try {
    	    /* global ActiveXObject */
    	    activeXDocument = document.domain && new ActiveXObject('htmlfile');
    	  } catch (error) {
    	    /* ignore */
    	  }

    	  NullProtoObject = activeXDocument ? NullProtoObjectViaActiveX(activeXDocument) : NullProtoObjectViaIFrame();
    	  var length = enumBugKeys.length;

    	  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];

    	  return NullProtoObject();
    	};

    	hiddenKeys[IE_PROTO] = true; // `Object.create` method
    	// https://tc39.github.io/ecma262/#sec-object.create

    	var objectCreate = Object.create || function create(O, Properties) {
    	  var result;

    	  if (O !== null) {
    	    EmptyConstructor[PROTOTYPE] = anObject(O);
    	    result = new EmptyConstructor();
    	    EmptyConstructor[PROTOTYPE] = null; // add "__proto__" for Object.getPrototypeOf polyfill

    	    result[IE_PROTO] = O;
    	  } else result = NullProtoObject();

    	  return Properties === undefined ? result : objectDefineProperties(result, Properties);
    	};

    	var nativeGetOwnPropertyNames = objectGetOwnPropertyNames.f;
    	var toString$1 = {}.toString;
    	var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames ? Object.getOwnPropertyNames(window) : [];

    	var getWindowNames = function (it) {
    	  try {
    	    return nativeGetOwnPropertyNames(it);
    	  } catch (error) {
    	    return windowNames.slice();
    	  }
    	}; // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window


    	var f$5 = function getOwnPropertyNames(it) {
    	  return windowNames && toString$1.call(it) == '[object Window]' ? getWindowNames(it) : nativeGetOwnPropertyNames(toIndexedObject(it));
    	};

    	var objectGetOwnPropertyNamesExternal = {
    	  f: f$5
    	};

    	var redefine = function (target, key, value, options) {
    	  if (options && options.enumerable) target[key] = value;else createNonEnumerableProperty(target, key, value);
    	};

    	var f$6 = wellKnownSymbol;
    	var wellKnownSymbolWrapped = {
    	  f: f$6
    	};

    	var defineProperty$5 = objectDefineProperty.f;

    	var defineWellKnownSymbol = function (NAME) {
    	  var Symbol = path.Symbol || (path.Symbol = {});
    	  if (!has(Symbol, NAME)) defineProperty$5(Symbol, NAME, {
    	    value: wellKnownSymbolWrapped.f(NAME)
    	  });
    	};

    	var TO_STRING_TAG = wellKnownSymbol('toStringTag');
    	var test = {};
    	test[TO_STRING_TAG] = 'z';
    	var toStringTagSupport = String(test) === '[object z]';

    	var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag'); // ES3 wrong here

    	var CORRECT_ARGUMENTS = classofRaw(function () {
    	  return arguments;
    	}()) == 'Arguments'; // fallback for IE11 Script Access Denied error

    	var tryGet = function (it, key) {
    	  try {
    	    return it[key];
    	  } catch (error) {
    	    /* empty */
    	  }
    	}; // getting tag from ES6+ `Object.prototype.toString`


    	var classof = toStringTagSupport ? classofRaw : function (it) {
    	  var O, tag, result;
    	  return it === undefined ? 'Undefined' : it === null ? 'Null' // @@toStringTag case
    	  : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$1)) == 'string' ? tag // builtinTag case
    	  : CORRECT_ARGUMENTS ? classofRaw(O) // ES3 arguments fallback
    	  : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
    	};

    	// https://tc39.github.io/ecma262/#sec-object.prototype.tostring


    	var objectToString = toStringTagSupport ? {}.toString : function toString() {
    	  return '[object ' + classof(this) + ']';
    	};

    	var defineProperty$6 = objectDefineProperty.f;
    	var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');

    	var setToStringTag = function (it, TAG, STATIC, SET_METHOD) {
    	  if (it) {
    	    var target = STATIC ? it : it.prototype;

    	    if (!has(target, TO_STRING_TAG$2)) {
    	      defineProperty$6(target, TO_STRING_TAG$2, {
    	        configurable: true,
    	        value: TAG
    	      });
    	    }

    	    if (SET_METHOD && !toStringTagSupport) {
    	      createNonEnumerableProperty(target, 'toString', objectToString);
    	    }
    	  }
    	};

    	var functionToString = Function.toString; // this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper

    	if (typeof sharedStore.inspectSource != 'function') {
    	  sharedStore.inspectSource = function (it) {
    	    return functionToString.call(it);
    	  };
    	}

    	var inspectSource = sharedStore.inspectSource;

    	var WeakMap = global_1.WeakMap;
    	var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

    	var WeakMap$1 = global_1.WeakMap;
    	var set, get, has$1;

    	var enforce = function (it) {
    	  return has$1(it) ? get(it) : set(it, {});
    	};

    	var getterFor = function (TYPE) {
    	  return function (it) {
    	    var state;

    	    if (!isObject(it) || (state = get(it)).type !== TYPE) {
    	      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    	    }

    	    return state;
    	  };
    	};

    	if (nativeWeakMap) {
    	  var store$1 = sharedStore.state || (sharedStore.state = new WeakMap$1());
    	  var wmget = store$1.get;
    	  var wmhas = store$1.has;
    	  var wmset = store$1.set;

    	  set = function (it, metadata) {
    	    metadata.facade = it;
    	    wmset.call(store$1, it, metadata);
    	    return metadata;
    	  };

    	  get = function (it) {
    	    return wmget.call(store$1, it) || {};
    	  };

    	  has$1 = function (it) {
    	    return wmhas.call(store$1, it);
    	  };
    	} else {
    	  var STATE = sharedKey('state');
    	  hiddenKeys[STATE] = true;

    	  set = function (it, metadata) {
    	    metadata.facade = it;
    	    createNonEnumerableProperty(it, STATE, metadata);
    	    return metadata;
    	  };

    	  get = function (it) {
    	    return has(it, STATE) ? it[STATE] : {};
    	  };

    	  has$1 = function (it) {
    	    return has(it, STATE);
    	  };
    	}

    	var internalState = {
    	  set: set,
    	  get: get,
    	  has: has$1,
    	  enforce: enforce,
    	  getterFor: getterFor
    	};

    	var $forEach = arrayIteration.forEach;
    	var HIDDEN = sharedKey('hidden');
    	var SYMBOL = 'Symbol';
    	var PROTOTYPE$1 = 'prototype';
    	var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
    	var setInternalState = internalState.set;
    	var getInternalState = internalState.getterFor(SYMBOL);
    	var ObjectPrototype = Object[PROTOTYPE$1];
    	var $Symbol = global_1.Symbol;
    	var $stringify = getBuiltIn('JSON', 'stringify');
    	var nativeGetOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;
    	var nativeDefineProperty$1 = objectDefineProperty.f;
    	var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f;
    	var nativePropertyIsEnumerable$1 = objectPropertyIsEnumerable.f;
    	var AllSymbols = shared('symbols');
    	var ObjectPrototypeSymbols = shared('op-symbols');
    	var StringToSymbolRegistry = shared('string-to-symbol-registry');
    	var SymbolToStringRegistry = shared('symbol-to-string-registry');
    	var WellKnownSymbolsStore$1 = shared('wks');
    	var QObject = global_1.QObject; // Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173

    	var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild; // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687

    	var setSymbolDescriptor = descriptors && fails(function () {
    	  return objectCreate(nativeDefineProperty$1({}, 'a', {
    	    get: function () {
    	      return nativeDefineProperty$1(this, 'a', {
    	        value: 7
    	      }).a;
    	    }
    	  })).a != 7;
    	}) ? function (O, P, Attributes) {
    	  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$2(ObjectPrototype, P);
    	  if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
    	  nativeDefineProperty$1(O, P, Attributes);

    	  if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
    	    nativeDefineProperty$1(ObjectPrototype, P, ObjectPrototypeDescriptor);
    	  }
    	} : nativeDefineProperty$1;

    	var wrap = function (tag, description) {
    	  var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
    	  setInternalState(symbol, {
    	    type: SYMBOL,
    	    tag: tag,
    	    description: description
    	  });
    	  if (!descriptors) symbol.description = description;
    	  return symbol;
    	};

    	var isSymbol = useSymbolAsUid ? function (it) {
    	  return typeof it == 'symbol';
    	} : function (it) {
    	  return Object(it) instanceof $Symbol;
    	};

    	var $defineProperty = function defineProperty(O, P, Attributes) {
    	  if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
    	  anObject(O);
    	  var key = toPrimitive(P, true);
    	  anObject(Attributes);

    	  if (has(AllSymbols, key)) {
    	    if (!Attributes.enumerable) {
    	      if (!has(O, HIDDEN)) nativeDefineProperty$1(O, HIDDEN, createPropertyDescriptor(1, {}));
    	      O[HIDDEN][key] = true;
    	    } else {
    	      if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
    	      Attributes = objectCreate(Attributes, {
    	        enumerable: createPropertyDescriptor(0, false)
    	      });
    	    }

    	    return setSymbolDescriptor(O, key, Attributes);
    	  }

    	  return nativeDefineProperty$1(O, key, Attributes);
    	};

    	var $defineProperties = function defineProperties(O, Properties) {
    	  anObject(O);
    	  var properties = toIndexedObject(Properties);
    	  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
    	  $forEach(keys, function (key) {
    	    if (!descriptors || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
    	  });
    	  return O;
    	};

    	var $create = function create(O, Properties) {
    	  return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
    	};

    	var $propertyIsEnumerable = function propertyIsEnumerable(V) {
    	  var P = toPrimitive(V, true);
    	  var enumerable = nativePropertyIsEnumerable$1.call(this, P);
    	  if (this === ObjectPrototype && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
    	  return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
    	};

    	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
    	  var it = toIndexedObject(O);
    	  var key = toPrimitive(P, true);
    	  if (it === ObjectPrototype && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
    	  var descriptor = nativeGetOwnPropertyDescriptor$2(it, key);

    	  if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
    	    descriptor.enumerable = true;
    	  }

    	  return descriptor;
    	};

    	var $getOwnPropertyNames = function getOwnPropertyNames(O) {
    	  var names = nativeGetOwnPropertyNames$1(toIndexedObject(O));
    	  var result = [];
    	  $forEach(names, function (key) {
    	    if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
    	  });
    	  return result;
    	};

    	var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
    	  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
    	  var names = nativeGetOwnPropertyNames$1(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
    	  var result = [];
    	  $forEach(names, function (key) {
    	    if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))) {
    	      result.push(AllSymbols[key]);
    	    }
    	  });
    	  return result;
    	}; // `Symbol` constructor
    	// https://tc39.github.io/ecma262/#sec-symbol-constructor


    	if (!nativeSymbol) {
    	  $Symbol = function Symbol() {
    	    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
    	    var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
    	    var tag = uid(description);

    	    var setter = function (value) {
    	      if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
    	      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
    	      setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
    	    };

    	    if (descriptors && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, {
    	      configurable: true,
    	      set: setter
    	    });
    	    return wrap(tag, description);
    	  };

    	  redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
    	    return getInternalState(this).tag;
    	  });
    	  redefine($Symbol, 'withoutSetter', function (description) {
    	    return wrap(uid(description), description);
    	  });
    	  objectPropertyIsEnumerable.f = $propertyIsEnumerable;
    	  objectDefineProperty.f = $defineProperty;
    	  objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor;
    	  objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames;
    	  objectGetOwnPropertySymbols.f = $getOwnPropertySymbols;

    	  wellKnownSymbolWrapped.f = function (name) {
    	    return wrap(wellKnownSymbol(name), name);
    	  };

    	  if (descriptors) {
    	    // https://github.com/tc39/proposal-Symbol-description
    	    nativeDefineProperty$1($Symbol[PROTOTYPE$1], 'description', {
    	      configurable: true,
    	      get: function description() {
    	        return getInternalState(this).description;
    	      }
    	    });
    	  }
    	}

    	_export({
    	  global: true,
    	  wrap: true,
    	  forced: !nativeSymbol,
    	  sham: !nativeSymbol
    	}, {
    	  Symbol: $Symbol
    	});
    	$forEach(objectKeys(WellKnownSymbolsStore$1), function (name) {
    	  defineWellKnownSymbol(name);
    	});
    	_export({
    	  target: SYMBOL,
    	  stat: true,
    	  forced: !nativeSymbol
    	}, {
    	  // `Symbol.for` method
    	  // https://tc39.github.io/ecma262/#sec-symbol.for
    	  'for': function (key) {
    	    var string = String(key);
    	    if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
    	    var symbol = $Symbol(string);
    	    StringToSymbolRegistry[string] = symbol;
    	    SymbolToStringRegistry[symbol] = string;
    	    return symbol;
    	  },
    	  // `Symbol.keyFor` method
    	  // https://tc39.github.io/ecma262/#sec-symbol.keyfor
    	  keyFor: function keyFor(sym) {
    	    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
    	    if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
    	  },
    	  useSetter: function () {
    	    USE_SETTER = true;
    	  },
    	  useSimple: function () {
    	    USE_SETTER = false;
    	  }
    	});
    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: !nativeSymbol,
    	  sham: !descriptors
    	}, {
    	  // `Object.create` method
    	  // https://tc39.github.io/ecma262/#sec-object.create
    	  create: $create,
    	  // `Object.defineProperty` method
    	  // https://tc39.github.io/ecma262/#sec-object.defineproperty
    	  defineProperty: $defineProperty,
    	  // `Object.defineProperties` method
    	  // https://tc39.github.io/ecma262/#sec-object.defineproperties
    	  defineProperties: $defineProperties,
    	  // `Object.getOwnPropertyDescriptor` method
    	  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
    	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor
    	});
    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: !nativeSymbol
    	}, {
    	  // `Object.getOwnPropertyNames` method
    	  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
    	  getOwnPropertyNames: $getOwnPropertyNames,
    	  // `Object.getOwnPropertySymbols` method
    	  // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
    	  getOwnPropertySymbols: $getOwnPropertySymbols
    	}); // Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
    	// https://bugs.chromium.org/p/v8/issues/detail?id=3443

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: fails(function () {
    	    objectGetOwnPropertySymbols.f(1);
    	  })
    	}, {
    	  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    	    return objectGetOwnPropertySymbols.f(toObject(it));
    	  }
    	}); // `JSON.stringify` method behavior with symbols
    	// https://tc39.github.io/ecma262/#sec-json.stringify

    	if ($stringify) {
    	  var FORCED_JSON_STRINGIFY = !nativeSymbol || fails(function () {
    	    var symbol = $Symbol(); // MS Edge converts symbol values to JSON as {}

    	    return $stringify([symbol]) != '[null]' // WebKit converts symbol values to JSON as null
    	    || $stringify({
    	      a: symbol
    	    }) != '{}' // V8 throws on boxed symbols
    	    || $stringify(Object(symbol)) != '{}';
    	  });
    	  _export({
    	    target: 'JSON',
    	    stat: true,
    	    forced: FORCED_JSON_STRINGIFY
    	  }, {
    	    // eslint-disable-next-line no-unused-vars
    	    stringify: function stringify(it, replacer, space) {
    	      var args = [it];
    	      var index = 1;
    	      var $replacer;

    	      while (arguments.length > index) args.push(arguments[index++]);

    	      $replacer = replacer;
    	      if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined

    	      if (!isArray(replacer)) replacer = function (key, value) {
    	        if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
    	        if (!isSymbol(value)) return value;
    	      };
    	      args[1] = replacer;
    	      return $stringify.apply(null, args);
    	    }
    	  });
    	} // `Symbol.prototype[@@toPrimitive]` method
    	// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive


    	if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) {
    	  createNonEnumerableProperty($Symbol[PROTOTYPE$1], TO_PRIMITIVE, $Symbol[PROTOTYPE$1].valueOf);
    	} // `Symbol.prototype[@@toStringTag]` property
    	// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag


    	setToStringTag($Symbol, SYMBOL);
    	hiddenKeys[HIDDEN] = true;

    	var getOwnPropertySymbols = path.Object.getOwnPropertySymbols;

    	var getOwnPropertySymbols$1 = getOwnPropertySymbols;

    	var getOwnPropertySymbols$2 = getOwnPropertySymbols$1;

    	var iterators = {};

    	var correctPrototypeGetter = !fails(function () {
    	  function F() {
    	    /* empty */
    	  }

    	  F.prototype.constructor = null;
    	  return Object.getPrototypeOf(new F()) !== F.prototype;
    	});

    	var IE_PROTO$1 = sharedKey('IE_PROTO');
    	var ObjectPrototype$1 = Object.prototype; // `Object.getPrototypeOf` method
    	// https://tc39.github.io/ecma262/#sec-object.getprototypeof

    	var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
    	  O = toObject(O);
    	  if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];

    	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    	    return O.constructor.prototype;
    	  }

    	  return O instanceof Object ? ObjectPrototype$1 : null;
    	};

    	var ITERATOR = wellKnownSymbol('iterator');
    	var BUGGY_SAFARI_ITERATORS = false;
    	// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object


    	var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

    	if ([].keys) {
    	  arrayIterator = [].keys(); // Safari 8 has buggy iterators w/o `next`

    	  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;else {
    	    PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
    	    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
    	  }
    	}

    	if (IteratorPrototype == undefined) IteratorPrototype = {}; // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()

    	var iteratorsCore = {
    	  IteratorPrototype: IteratorPrototype,
    	  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
    	};

    	var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;

    	var returnThis = function () {
    	  return this;
    	};

    	var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
    	  var TO_STRING_TAG = NAME + ' Iterator';
    	  IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, {
    	    next: createPropertyDescriptor(1, next)
    	  });
    	  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
    	  iterators[TO_STRING_TAG] = returnThis;
    	  return IteratorConstructor;
    	};

    	var aPossiblePrototype = function (it) {
    	  if (!isObject(it) && it !== null) {
    	    throw TypeError("Can't set " + String(it) + ' as a prototype');
    	  }

    	  return it;
    	};

    	// https://tc39.github.io/ecma262/#sec-object.setprototypeof
    	// Works with __proto__ only. Old v8 can't work with null proto objects.

    	/* eslint-disable no-proto */

    	var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
    	  var CORRECT_SETTER = false;
    	  var test = {};
    	  var setter;

    	  try {
    	    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    	    setter.call(test, []);
    	    CORRECT_SETTER = test instanceof Array;
    	  } catch (error) {
    	    /* empty */
    	  }

    	  return function setPrototypeOf(O, proto) {
    	    anObject(O);
    	    aPossiblePrototype(proto);
    	    if (CORRECT_SETTER) setter.call(O, proto);else O.__proto__ = proto;
    	    return O;
    	  };
    	}() : undefined);

    	var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
    	var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
    	var ITERATOR$1 = wellKnownSymbol('iterator');
    	var KEYS = 'keys';
    	var VALUES = 'values';
    	var ENTRIES = 'entries';

    	var returnThis$1 = function () {
    	  return this;
    	};

    	var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
    	  createIteratorConstructor(IteratorConstructor, NAME, next);

    	  var getIterationMethod = function (KIND) {
    	    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    	    if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];

    	    switch (KIND) {
    	      case KEYS:
    	        return function keys() {
    	          return new IteratorConstructor(this, KIND);
    	        };

    	      case VALUES:
    	        return function values() {
    	          return new IteratorConstructor(this, KIND);
    	        };

    	      case ENTRIES:
    	        return function entries() {
    	          return new IteratorConstructor(this, KIND);
    	        };
    	    }

    	    return function () {
    	      return new IteratorConstructor(this);
    	    };
    	  };

    	  var TO_STRING_TAG = NAME + ' Iterator';
    	  var INCORRECT_VALUES_NAME = false;
    	  var IterablePrototype = Iterable.prototype;
    	  var nativeIterator = IterablePrototype[ITERATOR$1] || IterablePrototype['@@iterator'] || DEFAULT && IterablePrototype[DEFAULT];
    	  var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
    	  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
    	  var CurrentIteratorPrototype, methods, KEY; // fix native

    	  if (anyNativeIterator) {
    	    CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));

    	    if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {


    	      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
    	      iterators[TO_STRING_TAG] = returnThis$1;
    	    }
    	  } // fix Array#{values, @@iterator}.name in V8 / FF


    	  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    	    INCORRECT_VALUES_NAME = true;

    	    defaultIterator = function values() {
    	      return nativeIterator.call(this);
    	    };
    	  } // define iterator


    	  if (( FORCED) && IterablePrototype[ITERATOR$1] !== defaultIterator) {
    	    createNonEnumerableProperty(IterablePrototype, ITERATOR$1, defaultIterator);
    	  }

    	  iterators[NAME] = defaultIterator; // export additional methods

    	  if (DEFAULT) {
    	    methods = {
    	      values: getIterationMethod(VALUES),
    	      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
    	      entries: getIterationMethod(ENTRIES)
    	    };
    	    if (FORCED) for (KEY in methods) {
    	      if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
    	        redefine(IterablePrototype, KEY, methods[KEY]);
    	      }
    	    } else _export({
    	      target: NAME,
    	      proto: true,
    	      forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME
    	    }, methods);
    	  }

    	  return methods;
    	};

    	var ARRAY_ITERATOR = 'Array Iterator';
    	var setInternalState$1 = internalState.set;
    	var getInternalState$1 = internalState.getterFor(ARRAY_ITERATOR); // `Array.prototype.entries` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.entries
    	// `Array.prototype.keys` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.keys
    	// `Array.prototype.values` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.values
    	// `Array.prototype[@@iterator]` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
    	// `CreateArrayIterator` internal method
    	// https://tc39.github.io/ecma262/#sec-createarrayiterator

    	var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
    	  setInternalState$1(this, {
    	    type: ARRAY_ITERATOR,
    	    target: toIndexedObject(iterated),
    	    // target
    	    index: 0,
    	    // next index
    	    kind: kind // kind

    	  }); // `%ArrayIteratorPrototype%.next` method
    	  // https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
    	}, function () {
    	  var state = getInternalState$1(this);
    	  var target = state.target;
    	  var kind = state.kind;
    	  var index = state.index++;

    	  if (!target || index >= target.length) {
    	    state.target = undefined;
    	    return {
    	      value: undefined,
    	      done: true
    	    };
    	  }

    	  if (kind == 'keys') return {
    	    value: index,
    	    done: false
    	  };
    	  if (kind == 'values') return {
    	    value: target[index],
    	    done: false
    	  };
    	  return {
    	    value: [index, target[index]],
    	    done: false
    	  };
    	}, 'values'); // argumentsList[@@iterator] is %ArrayProto_values%
    	// https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
    	// https://tc39.github.io/ecma262/#sec-createmappedargumentsobject

    	iterators.Arguments = iterators.Array; // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables

    	// iterable DOM collections
    	// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
    	var domIterables = {
    	  CSSRuleList: 0,
    	  CSSStyleDeclaration: 0,
    	  CSSValueList: 0,
    	  ClientRectList: 0,
    	  DOMRectList: 0,
    	  DOMStringList: 0,
    	  DOMTokenList: 1,
    	  DataTransferItemList: 0,
    	  FileList: 0,
    	  HTMLAllCollection: 0,
    	  HTMLCollection: 0,
    	  HTMLFormElement: 0,
    	  HTMLSelectElement: 0,
    	  MediaList: 0,
    	  MimeTypeArray: 0,
    	  NamedNodeMap: 0,
    	  NodeList: 1,
    	  PaintRequestList: 0,
    	  Plugin: 0,
    	  PluginArray: 0,
    	  SVGLengthList: 0,
    	  SVGNumberList: 0,
    	  SVGPathSegList: 0,
    	  SVGPointList: 0,
    	  SVGStringList: 0,
    	  SVGTransformList: 0,
    	  SourceBufferList: 0,
    	  StyleSheetList: 0,
    	  TextTrackCueList: 0,
    	  TextTrackList: 0,
    	  TouchList: 0
    	};

    	var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');

    	for (var COLLECTION_NAME in domIterables) {
    	  var Collection = global_1[COLLECTION_NAME];
    	  var CollectionPrototype = Collection && Collection.prototype;

    	  if (CollectionPrototype && classof(CollectionPrototype) !== TO_STRING_TAG$3) {
    	    createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG$3, COLLECTION_NAME);
    	  }

    	  iterators[COLLECTION_NAME] = iterators.Array;
    	}

    	var createMethod$3 = function (CONVERT_TO_STRING) {
    	  return function ($this, pos) {
    	    var S = String(requireObjectCoercible($this));
    	    var position = toInteger(pos);
    	    var size = S.length;
    	    var first, second;
    	    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    	    first = S.charCodeAt(position);
    	    return first < 0xD800 || first > 0xDBFF || position + 1 === size || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF ? CONVERT_TO_STRING ? S.charAt(position) : first : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
    	  };
    	};

    	var stringMultibyte = {
    	  // `String.prototype.codePointAt` method
    	  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
    	  codeAt: createMethod$3(false),
    	  // `String.prototype.at` method
    	  // https://github.com/mathiasbynens/String.prototype.at
    	  charAt: createMethod$3(true)
    	};

    	var charAt = stringMultibyte.charAt;
    	var STRING_ITERATOR = 'String Iterator';
    	var setInternalState$2 = internalState.set;
    	var getInternalState$2 = internalState.getterFor(STRING_ITERATOR); // `String.prototype[@@iterator]` method
    	// https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator

    	defineIterator(String, 'String', function (iterated) {
    	  setInternalState$2(this, {
    	    type: STRING_ITERATOR,
    	    string: String(iterated),
    	    index: 0
    	  }); // `%StringIteratorPrototype%.next` method
    	  // https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
    	}, function next() {
    	  var state = getInternalState$2(this);
    	  var string = state.string;
    	  var index = state.index;
    	  var point;
    	  if (index >= string.length) return {
    	    value: undefined,
    	    done: true
    	  };
    	  point = charAt(string, index);
    	  state.index += point.length;
    	  return {
    	    value: point,
    	    done: false
    	  };
    	});

    	var ITERATOR$2 = wellKnownSymbol('iterator');

    	var getIteratorMethod = function (it) {
    	  if (it != undefined) return it[ITERATOR$2] || it['@@iterator'] || iterators[classof(it)];
    	};

    	var getIterator = function (it) {
    	  var iteratorMethod = getIteratorMethod(it);

    	  if (typeof iteratorMethod != 'function') {
    	    throw TypeError(String(it) + ' is not iterable');
    	  }

    	  return anObject(iteratorMethod.call(it));
    	};

    	var getIterator_1 = getIterator;

    	var getIterator$1 = getIterator_1;

    	var getIteratorMethod_1 = getIteratorMethod;

    	var getIteratorMethod$1 = getIteratorMethod_1;

    	var iteratorClose = function (iterator) {
    	  var returnMethod = iterator['return'];

    	  if (returnMethod !== undefined) {
    	    return anObject(returnMethod.call(iterator)).value;
    	  }
    	};

    	var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
    	  try {
    	    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value); // 7.4.6 IteratorClose(iterator, completion)
    	  } catch (error) {
    	    iteratorClose(iterator);
    	    throw error;
    	  }
    	};

    	var ITERATOR$3 = wellKnownSymbol('iterator');
    	var ArrayPrototype$4 = Array.prototype; // check on default Array iterator

    	var isArrayIteratorMethod = function (it) {
    	  return it !== undefined && (iterators.Array === it || ArrayPrototype$4[ITERATOR$3] === it);
    	};

    	// https://tc39.github.io/ecma262/#sec-array.from


    	var arrayFrom = function from(arrayLike
    	/* , mapfn = undefined, thisArg = undefined */
    	) {
    	  var O = toObject(arrayLike);
    	  var C = typeof this == 'function' ? this : Array;
    	  var argumentsLength = arguments.length;
    	  var mapfn = argumentsLength > 1 ? arguments[1] : undefined;
    	  var mapping = mapfn !== undefined;
    	  var iteratorMethod = getIteratorMethod(O);
    	  var index = 0;
    	  var length, result, step, iterator, next, value;
    	  if (mapping) mapfn = functionBindContext(mapfn, argumentsLength > 2 ? arguments[2] : undefined, 2); // if the target is not iterable or it's an array with the default iterator - use a simple case

    	  if (iteratorMethod != undefined && !(C == Array && isArrayIteratorMethod(iteratorMethod))) {
    	    iterator = iteratorMethod.call(O);
    	    next = iterator.next;
    	    result = new C();

    	    for (; !(step = next.call(iterator)).done; index++) {
    	      value = mapping ? callWithSafeIterationClosing(iterator, mapfn, [step.value, index], true) : step.value;
    	      createProperty(result, index, value);
    	    }
    	  } else {
    	    length = toLength(O.length);
    	    result = new C(length);

    	    for (; length > index; index++) {
    	      value = mapping ? mapfn(O[index], index) : O[index];
    	      createProperty(result, index, value);
    	    }
    	  }

    	  result.length = index;
    	  return result;
    	};

    	var ITERATOR$4 = wellKnownSymbol('iterator');
    	var SAFE_CLOSING = false;

    	try {
    	  var called = 0;
    	  var iteratorWithReturn = {
    	    next: function () {
    	      return {
    	        done: !!called++
    	      };
    	    },
    	    'return': function () {
    	      SAFE_CLOSING = true;
    	    }
    	  };

    	  iteratorWithReturn[ITERATOR$4] = function () {
    	    return this;
    	  }; // eslint-disable-next-line no-throw-literal


    	  Array.from(iteratorWithReturn, function () {
    	    throw 2;
    	  });
    	} catch (error) {
    	  /* empty */
    	}

    	var checkCorrectnessOfIteration = function (exec, SKIP_CLOSING) {
    	  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
    	  var ITERATION_SUPPORT = false;

    	  try {
    	    var object = {};

    	    object[ITERATOR$4] = function () {
    	      return {
    	        next: function () {
    	          return {
    	            done: ITERATION_SUPPORT = true
    	          };
    	        }
    	      };
    	    };

    	    exec(object);
    	  } catch (error) {
    	    /* empty */
    	  }

    	  return ITERATION_SUPPORT;
    	};

    	var INCORRECT_ITERATION = !checkCorrectnessOfIteration(function (iterable) {
    	  Array.from(iterable);
    	}); // `Array.from` method
    	// https://tc39.github.io/ecma262/#sec-array.from

    	_export({
    	  target: 'Array',
    	  stat: true,
    	  forced: INCORRECT_ITERATION
    	}, {
    	  from: arrayFrom
    	});

    	var from_1 = path.Array.from;

    	var from_1$1 = from_1;

    	var from_1$2 = from_1$1;

    	// https://tc39.github.io/ecma262/#sec-object.create

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  sham: !descriptors
    	}, {
    	  create: objectCreate
    	});

    	var Object$1 = path.Object;

    	var create = function create(P, D) {
    	  return Object$1.create(P, D);
    	};

    	var create$1 = create;

    	var create$2 = create$1;

    	function _defineProperty(obj, key, value) {
    	  if (key in obj) {
    	    defineProperty$2(obj, key, {
    	      value: value,
    	      enumerable: true,
    	      configurable: true,
    	      writable: true
    	    });
    	  } else {
    	    obj[key] = value;
    	  }

    	  return obj;
    	}

    	var defineProperty$7 = _defineProperty;

    	// a string of all valid unicode whitespaces
    	// eslint-disable-next-line max-len
    	var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

    	var whitespace = '[' + whitespaces + ']';
    	var ltrim = RegExp('^' + whitespace + whitespace + '*');
    	var rtrim = RegExp(whitespace + whitespace + '*$'); // `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation

    	var createMethod$4 = function (TYPE) {
    	  return function ($this) {
    	    var string = String(requireObjectCoercible($this));
    	    if (TYPE & 1) string = string.replace(ltrim, '');
    	    if (TYPE & 2) string = string.replace(rtrim, '');
    	    return string;
    	  };
    	};

    	var stringTrim = {
    	  // `String.prototype.{ trimLeft, trimStart }` methods
    	  // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
    	  start: createMethod$4(1),
    	  // `String.prototype.{ trimRight, trimEnd }` methods
    	  // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
    	  end: createMethod$4(2),
    	  // `String.prototype.trim` method
    	  // https://tc39.github.io/ecma262/#sec-string.prototype.trim
    	  trim: createMethod$4(3)
    	};

    	var non = '\u200B\u0085\u180E'; // check that a method works with the correct list
    	// of whitespaces and has a correct name

    	var stringTrimForced = function (METHOD_NAME) {
    	  return fails(function () {
    	    return !!whitespaces[METHOD_NAME]() || non[METHOD_NAME]() != non || whitespaces[METHOD_NAME].name !== METHOD_NAME;
    	  });
    	};

    	var $trim = stringTrim.trim; // `String.prototype.trim` method
    	// https://tc39.github.io/ecma262/#sec-string.prototype.trim

    	_export({
    	  target: 'String',
    	  proto: true,
    	  forced: stringTrimForced('trim')
    	}, {
    	  trim: function trim() {
    	    return $trim(this);
    	  }
    	});

    	var trim = entryVirtual('String').trim;

    	var $forEach$1 = arrayIteration.forEach;
    	var STRICT_METHOD$1 = arrayMethodIsStrict('forEach');
    	var USES_TO_LENGTH$3 = arrayMethodUsesToLength('forEach'); // `Array.prototype.forEach` method implementation
    	// https://tc39.github.io/ecma262/#sec-array.prototype.foreach

    	var arrayForEach = !STRICT_METHOD$1 || !USES_TO_LENGTH$3 ? function forEach(callbackfn
    	/* , thisArg */
    	) {
    	  return $forEach$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    	} : [].forEach;

    	// https://tc39.github.io/ecma262/#sec-array.prototype.foreach


    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: [].forEach != arrayForEach
    	}, {
    	  forEach: arrayForEach
    	});

    	var forEach = entryVirtual('Array').forEach;

    	var forEach$1 = forEach;

    	var ArrayPrototype$5 = Array.prototype;
    	var DOMIterables = {
    	  DOMTokenList: true,
    	  NodeList: true
    	};

    	var forEach_1 = function (it) {
    	  var own = it.forEach;
    	  return it === ArrayPrototype$5 || it instanceof Array && own === ArrayPrototype$5.forEach // eslint-disable-next-line no-prototype-builtins
    	  || DOMIterables.hasOwnProperty(classof(it)) ? forEach$1 : own;
    	};

    	var forEach$2 = forEach_1;

    	var trim$1 = stringTrim.trim;
    	var $parseInt = global_1.parseInt;
    	var hex = /^[+-]?0[Xx]/;
    	var FORCED$1 = $parseInt(whitespaces + '08') !== 8 || $parseInt(whitespaces + '0x16') !== 22; // `parseInt` method
    	// https://tc39.github.io/ecma262/#sec-parseint-string-radix

    	var numberParseInt = FORCED$1 ? function parseInt(string, radix) {
    	  var S = trim$1(String(string));
    	  return $parseInt(S, radix >>> 0 || (hex.test(S) ? 16 : 10));
    	} : $parseInt;

    	// https://tc39.github.io/ecma262/#sec-parseint-string-radix

    	_export({
    	  global: true,
    	  forced: parseInt != numberParseInt
    	}, {
    	  parseInt: numberParseInt
    	});

    	var propertyIsEnumerable = objectPropertyIsEnumerable.f; // `Object.{ entries, values }` methods implementation

    	var createMethod$5 = function (TO_ENTRIES) {
    	  return function (it) {
    	    var O = toIndexedObject(it);
    	    var keys = objectKeys(O);
    	    var length = keys.length;
    	    var i = 0;
    	    var result = [];
    	    var key;

    	    while (length > i) {
    	      key = keys[i++];

    	      if (!descriptors || propertyIsEnumerable.call(O, key)) {
    	        result.push(TO_ENTRIES ? [key, O[key]] : O[key]);
    	      }
    	    }

    	    return result;
    	  };
    	};

    	var objectToArray = {
    	  // `Object.entries` method
    	  // https://tc39.github.io/ecma262/#sec-object.entries
    	  entries: createMethod$5(true),
    	  // `Object.values` method
    	  // https://tc39.github.io/ecma262/#sec-object.values
    	  values: createMethod$5(false)
    	};

    	var $values = objectToArray.values; // `Object.values` method
    	// https://tc39.github.io/ecma262/#sec-object.values

    	_export({
    	  target: 'Object',
    	  stat: true
    	}, {
    	  values: function values(O) {
    	    return $values(O);
    	  }
    	});

    	var values = path.Object.values;

    	var FAILS_ON_PRIMITIVES$1 = fails(function () {
    	  objectGetPrototypeOf(1);
    	}); // `Object.getPrototypeOf` method
    	// https://tc39.github.io/ecma262/#sec-object.getprototypeof

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: FAILS_ON_PRIMITIVES$1,
    	  sham: !correctPrototypeGetter
    	}, {
    	  getPrototypeOf: function getPrototypeOf(it) {
    	    return objectGetPrototypeOf(toObject(it));
    	  }
    	});

    	var getPrototypeOf = path.Object.getPrototypeOf;

    	var $indexOf = arrayIncludes.indexOf;
    	var nativeIndexOf = [].indexOf;
    	var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
    	var STRICT_METHOD$2 = arrayMethodIsStrict('indexOf');
    	var USES_TO_LENGTH$4 = arrayMethodUsesToLength('indexOf', {
    	  ACCESSORS: true,
    	  1: 0
    	}); // `Array.prototype.indexOf` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.indexof

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: NEGATIVE_ZERO || !STRICT_METHOD$2 || !USES_TO_LENGTH$4
    	}, {
    	  indexOf: function indexOf(searchElement
    	  /* , fromIndex = 0 */
    	  ) {
    	    return NEGATIVE_ZERO // convert -0 to +0
    	    ? nativeIndexOf.apply(this, arguments) || 0 : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
    	  }
    	});

    	var indexOf$1 = entryVirtual('Array').indexOf;

    	var nativeAssign = Object.assign;
    	var defineProperty$8 = Object.defineProperty; // `Object.assign` method
    	// https://tc39.github.io/ecma262/#sec-object.assign

    	var objectAssign = !nativeAssign || fails(function () {
    	  // should have correct order of operations (Edge bug)
    	  if (descriptors && nativeAssign({
    	    b: 1
    	  }, nativeAssign(defineProperty$8({}, 'a', {
    	    enumerable: true,
    	    get: function () {
    	      defineProperty$8(this, 'b', {
    	        value: 3,
    	        enumerable: false
    	      });
    	    }
    	  }), {
    	    b: 2
    	  })).b !== 1) return true; // should work with symbols and should have deterministic property order (V8 bug)

    	  var A = {};
    	  var B = {}; // eslint-disable-next-line no-undef

    	  var symbol = Symbol();
    	  var alphabet = 'abcdefghijklmnopqrst';
    	  A[symbol] = 7;
    	  alphabet.split('').forEach(function (chr) {
    	    B[chr] = chr;
    	  });
    	  return nativeAssign({}, A)[symbol] != 7 || objectKeys(nativeAssign({}, B)).join('') != alphabet;
    	}) ? function assign(target, source) {
    	  // eslint-disable-line no-unused-vars
    	  var T = toObject(target);
    	  var argumentsLength = arguments.length;
    	  var index = 1;
    	  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    	  var propertyIsEnumerable = objectPropertyIsEnumerable.f;

    	  while (argumentsLength > index) {
    	    var S = indexedObject(arguments[index++]);
    	    var keys = getOwnPropertySymbols ? objectKeys(S).concat(getOwnPropertySymbols(S)) : objectKeys(S);
    	    var length = keys.length;
    	    var j = 0;
    	    var key;

    	    while (length > j) {
    	      key = keys[j++];
    	      if (!descriptors || propertyIsEnumerable.call(S, key)) T[key] = S[key];
    	    }
    	  }

    	  return T;
    	} : nativeAssign;

    	// https://tc39.github.io/ecma262/#sec-object.assign

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: Object.assign !== objectAssign
    	}, {
    	  assign: objectAssign
    	});

    	var assign = path.Object.assign;

    	var assign$1 = assign;

    	var assign$2 = assign$1;

    	// https://tc39.github.io/ecma262/#sec-array.isarray

    	_export({
    	  target: 'Array',
    	  stat: true
    	}, {
    	  isArray: isArray
    	});

    	var isArray$1 = path.Array.isArray;

    	var isArray$2 = isArray$1;

    	var isArray$3 = isArray$2;

    	function _arrayWithHoles(arr) {
    	  if (isArray$3(arr)) return arr;
    	}

    	var arrayWithHoles = _arrayWithHoles;

    	var ITERATOR$5 = wellKnownSymbol('iterator');

    	var isIterable = function (it) {
    	  var O = Object(it);
    	  return O[ITERATOR$5] !== undefined || '@@iterator' in O // eslint-disable-next-line no-prototype-builtins
    	  || iterators.hasOwnProperty(classof(O));
    	};

    	var isIterable_1 = isIterable;

    	var isIterable$1 = isIterable_1;

    	var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
    	var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
    	var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded'; // We can't use this feature detection in V8 since it causes
    	// deoptimization and serious performance degradation
    	// https://github.com/zloirock/core-js/issues/679

    	var IS_CONCAT_SPREADABLE_SUPPORT = engineV8Version >= 51 || !fails(function () {
    	  var array = [];
    	  array[IS_CONCAT_SPREADABLE] = false;
    	  return array.concat()[0] !== array;
    	});
    	var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

    	var isConcatSpreadable = function (O) {
    	  if (!isObject(O)) return false;
    	  var spreadable = O[IS_CONCAT_SPREADABLE];
    	  return spreadable !== undefined ? !!spreadable : isArray(O);
    	};

    	var FORCED$2 = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT; // `Array.prototype.concat` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.concat
    	// with adding support of @@isConcatSpreadable and @@species

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: FORCED$2
    	}, {
    	  concat: function concat(arg) {
    	    // eslint-disable-line no-unused-vars
    	    var O = toObject(this);
    	    var A = arraySpeciesCreate(O, 0);
    	    var n = 0;
    	    var i, k, length, len, E;

    	    for (i = -1, length = arguments.length; i < length; i++) {
    	      E = i === -1 ? O : arguments[i];

    	      if (isConcatSpreadable(E)) {
    	        len = toLength(E.length);
    	        if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);

    	        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
    	      } else {
    	        if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
    	        createProperty(A, n++, E);
    	      }
    	    }

    	    A.length = n;
    	    return A;
    	  }
    	});

    	// https://tc39.github.io/ecma262/#sec-symbol.asynciterator

    	defineWellKnownSymbol('asyncIterator');

    	// https://tc39.github.io/ecma262/#sec-symbol.hasinstance

    	defineWellKnownSymbol('hasInstance');

    	// https://tc39.github.io/ecma262/#sec-symbol.isconcatspreadable

    	defineWellKnownSymbol('isConcatSpreadable');

    	// https://tc39.github.io/ecma262/#sec-symbol.iterator

    	defineWellKnownSymbol('iterator');

    	// https://tc39.github.io/ecma262/#sec-symbol.match

    	defineWellKnownSymbol('match');

    	defineWellKnownSymbol('matchAll');

    	// https://tc39.github.io/ecma262/#sec-symbol.replace

    	defineWellKnownSymbol('replace');

    	// https://tc39.github.io/ecma262/#sec-symbol.search

    	defineWellKnownSymbol('search');

    	// https://tc39.github.io/ecma262/#sec-symbol.species

    	defineWellKnownSymbol('species');

    	// https://tc39.github.io/ecma262/#sec-symbol.split

    	defineWellKnownSymbol('split');

    	// https://tc39.github.io/ecma262/#sec-symbol.toprimitive

    	defineWellKnownSymbol('toPrimitive');

    	// https://tc39.github.io/ecma262/#sec-symbol.tostringtag

    	defineWellKnownSymbol('toStringTag');

    	// https://tc39.github.io/ecma262/#sec-symbol.unscopables

    	defineWellKnownSymbol('unscopables');

    	// https://tc39.github.io/ecma262/#sec-json-@@tostringtag

    	setToStringTag(global_1.JSON, 'JSON', true);

    	var symbol = path.Symbol;

    	// https://github.com/tc39/proposal-using-statement

    	defineWellKnownSymbol('asyncDispose');

    	// https://github.com/tc39/proposal-using-statement

    	defineWellKnownSymbol('dispose');

    	// https://github.com/tc39/proposal-observable

    	defineWellKnownSymbol('observable');

    	// https://github.com/tc39/proposal-pattern-matching

    	defineWellKnownSymbol('patternMatch');

    	defineWellKnownSymbol('replaceAll');

    	var symbol$1 = symbol;

    	var symbol$2 = symbol$1;

    	function _iterableToArrayLimit(arr, i) {
    	  if (typeof symbol$2 === "undefined" || !isIterable$1(Object(arr))) return;
    	  var _arr = [];
    	  var _n = true;
    	  var _d = false;
    	  var _e = undefined;

    	  try {
    	    for (var _i = getIterator$1(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
    	      _arr.push(_s.value);

    	      if (i && _arr.length === i) break;
    	    }
    	  } catch (err) {
    	    _d = true;
    	    _e = err;
    	  } finally {
    	    try {
    	      if (!_n && _i["return"] != null) _i["return"]();
    	    } finally {
    	      if (_d) throw _e;
    	    }
    	  }

    	  return _arr;
    	}

    	var iterableToArrayLimit = _iterableToArrayLimit;

    	var from_1$3 = from_1;

    	var from_1$4 = from_1$3;

    	var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('slice');
    	var USES_TO_LENGTH$5 = arrayMethodUsesToLength('slice', {
    	  ACCESSORS: true,
    	  0: 0,
    	  1: 2
    	});
    	var SPECIES$2 = wellKnownSymbol('species');
    	var nativeSlice = [].slice;
    	var max$1 = Math.max; // `Array.prototype.slice` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.slice
    	// fallback for not array-like ES3 strings and DOM objects

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: !HAS_SPECIES_SUPPORT$2 || !USES_TO_LENGTH$5
    	}, {
    	  slice: function slice(start, end) {
    	    var O = toIndexedObject(this);
    	    var length = toLength(O.length);
    	    var k = toAbsoluteIndex(start, length);
    	    var fin = toAbsoluteIndex(end === undefined ? length : end, length); // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible

    	    var Constructor, result, n;

    	    if (isArray(O)) {
    	      Constructor = O.constructor; // cross-realm fallback

    	      if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
    	        Constructor = undefined;
    	      } else if (isObject(Constructor)) {
    	        Constructor = Constructor[SPECIES$2];
    	        if (Constructor === null) Constructor = undefined;
    	      }

    	      if (Constructor === Array || Constructor === undefined) {
    	        return nativeSlice.call(O, k, fin);
    	      }
    	    }

    	    result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));

    	    for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);

    	    result.length = n;
    	    return result;
    	  }
    	});

    	var slice$1 = entryVirtual('Array').slice;

    	var ArrayPrototype$6 = Array.prototype;

    	var slice_1 = function (it) {
    	  var own = it.slice;
    	  return it === ArrayPrototype$6 || it instanceof Array && own === ArrayPrototype$6.slice ? slice$1 : own;
    	};

    	var slice$2 = slice_1;

    	var slice$3 = slice$2;

    	function _arrayLikeToArray(arr, len) {
    	  if (len == null || len > arr.length) len = arr.length;

    	  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    	    arr2[i] = arr[i];
    	  }

    	  return arr2;
    	}

    	var arrayLikeToArray = _arrayLikeToArray;

    	function _unsupportedIterableToArray(o, minLen) {
    	  var _context;

    	  if (!o) return;
    	  if (typeof o === "string") return arrayLikeToArray(o, minLen);

    	  var n = slice$3(_context = Object.prototype.toString.call(o)).call(_context, 8, -1);

    	  if (n === "Object" && o.constructor) n = o.constructor.name;
    	  if (n === "Map" || n === "Set") return from_1$4(o);
    	  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
    	}

    	var unsupportedIterableToArray = _unsupportedIterableToArray;

    	function _nonIterableRest() {
    	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    	}

    	var nonIterableRest = _nonIterableRest;

    	function _slicedToArray(arr, i) {
    	  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
    	}

    	var slicedToArray = _slicedToArray;

    	// https://tc39.github.io/ecma262/#sec-date.now

    	_export({
    	  target: 'Date',
    	  stat: true
    	}, {
    	  now: function now() {
    	    return new Date().getTime();
    	  }
    	});

    	var now = path.Date.now;

    	var FAILS_ON_PRIMITIVES$2 = fails(function () {
    	  objectKeys(1);
    	}); // `Object.keys` method
    	// https://tc39.github.io/ecma262/#sec-object.keys

    	_export({
    	  target: 'Object',
    	  stat: true,
    	  forced: FAILS_ON_PRIMITIVES$2
    	}, {
    	  keys: function keys(it) {
    	    return objectKeys(toObject(it));
    	  }
    	});

    	var keys$1 = path.Object.keys;

    	var keys$2 = keys$1;

    	var keys$3 = keys$2;

    	var isArray$4 = isArray$1;

    	var isArray$5 = isArray$4;

    	var iterator = wellKnownSymbolWrapped.f('iterator');

    	var iterator$1 = iterator;

    	var iterator$2 = iterator$1;

    	var _typeof_1 = createCommonjsModule(function (module) {
    	  function _typeof(obj) {
    	    "@babel/helpers - typeof";

    	    if (typeof symbol$2 === "function" && typeof iterator$2 === "symbol") {
    	      module.exports = _typeof = function _typeof(obj) {
    	        return typeof obj;
    	      };
    	    } else {
    	      module.exports = _typeof = function _typeof(obj) {
    	        return obj && typeof symbol$2 === "function" && obj.constructor === symbol$2 && obj !== symbol$2.prototype ? "symbol" : typeof obj;
    	      };
    	    }

    	    return _typeof(obj);
    	  }

    	  module.exports = _typeof;
    	});

    	// https://tc39.github.io/ecma262/#sec-reflect.ownkeys

    	_export({
    	  target: 'Reflect',
    	  stat: true
    	}, {
    	  ownKeys: ownKeys
    	});

    	var ownKeys$1 = path.Reflect.ownKeys;

    	var ownKeys$2 = ownKeys$1;

    	var ownKeys$3 = ownKeys$2;

    	var slice$4 = slice_1;

    	var slice$5 = slice$4;

    	function _arrayWithoutHoles(arr) {
    	  if (isArray$3(arr)) return arrayLikeToArray(arr);
    	}

    	var arrayWithoutHoles = _arrayWithoutHoles;

    	function _iterableToArray(iter) {
    	  if (typeof symbol$2 !== "undefined" && isIterable$1(Object(iter))) return from_1$4(iter);
    	}

    	var iterableToArray = _iterableToArray;

    	function _nonIterableSpread() {
    	  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    	}

    	var nonIterableSpread = _nonIterableSpread;

    	function _toConsumableArray(arr) {
    	  return arrayWithoutHoles(arr) || iterableToArray(arr) || unsupportedIterableToArray(arr) || nonIterableSpread();
    	}

    	var toConsumableArray = _toConsumableArray;

    	var concat = entryVirtual('Array').concat;

    	var ArrayPrototype$7 = Array.prototype;

    	var concat_1 = function (it) {
    	  var own = it.concat;
    	  return it === ArrayPrototype$7 || it instanceof Array && own === ArrayPrototype$7.concat ? concat : own;
    	};

    	var concat$1 = concat_1;

    	var concat$2 = concat$1;

    	var symbol$3 = symbol;

    	var symbol$4 = symbol$3;

    	function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof symbol$4 === "undefined" || getIteratorMethod$1(o) == null) { if (isArray$5(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = getIterator$1(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

    	function _unsupportedIterableToArray$1(o, minLen) { var _context13; if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = slice$5(_context13 = Object.prototype.toString.call(o)).call(_context13, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return from_1$2(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }

    	function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    	/**
    	 * vis-util
    	 * https://github.com/visjs/vis-util
    	 *
    	 * utilitie collection for visjs
    	 *
    	 * @version 4.3.4
    	 * @date    2020-08-01T15:11:53.524Z
    	 *
    	 * @copyright (c) 2011-2017 Almende B.V, http://almende.com
    	 * @copyright (c) 2017-2019 visjs contributors, https://github.com/visjs
    	 *
    	 * @license
    	 * vis.js is dual licensed under both
    	 *
    	 *   1. The Apache 2.0 License
    	 *      http://www.apache.org/licenses/LICENSE-2.0
    	 *
    	 *   and
    	 *
    	 *   2. The MIT License
    	 *      http://opensource.org/licenses/MIT
    	 *
    	 * vis.js may be distributed under either license.
    	 */

    	/**
    	 * Use this symbol to delete properies in deepObjectAssign.
    	 */
    	var DELETE = symbol$4("DELETE");
    	/**
    	 * Pure version of deepObjectAssign, it doesn't modify any of it's arguments.
    	 *
    	 * @param base - The base object that fullfils the whole interface T.
    	 * @param updates - Updates that may change or delete props.
    	 *
    	 * @returns A brand new instance with all the supplied objects deeply merged.
    	 */


    	function pureDeepObjectAssign(base) {
    	  var _context;

    	  for (var _len = arguments.length, updates = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    	    updates[_key - 1] = arguments[_key];
    	  }

    	  return deepObjectAssign.apply(void 0, concat$2(_context = [{}, base]).call(_context, updates));
    	}
    	/**
    	 * Deep version of object assign with additional deleting by the DELETE symbol.
    	 *
    	 * @param values - Objects to be deeply merged.
    	 *
    	 * @returns The first object from values.
    	 */


    	function deepObjectAssign() {
    	  var merged = deepObjectAssignNonentry.apply(void 0, arguments);
    	  stripDelete(merged);
    	  return merged;
    	}
    	/**
    	 * Deep version of object assign with additional deleting by the DELETE symbol.
    	 *
    	 * @remarks
    	 * This doesn't strip the DELETE symbols so they may end up in the final object.
    	 *
    	 * @param values - Objects to be deeply merged.
    	 *
    	 * @returns The first object from values.
    	 */


    	function deepObjectAssignNonentry() {
    	  for (var _len2 = arguments.length, values = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    	    values[_key2] = arguments[_key2];
    	  }

    	  if (values.length < 2) {
    	    return values[0];
    	  } else if (values.length > 2) {
    	    var _context2;

    	    return deepObjectAssignNonentry.apply(void 0, concat$2(_context2 = [deepObjectAssign(values[0], values[1])]).call(_context2, toConsumableArray(slice$5(values).call(values, 2))));
    	  }

    	  var a = values[0];
    	  var b = values[1];

    	  var _iterator = _createForOfIteratorHelper(ownKeys$3(b)),
    	      _step;

    	  try {
    	    for (_iterator.s(); !(_step = _iterator.n()).done;) {
    	      var prop = _step.value;
    	      if (!Object.prototype.propertyIsEnumerable.call(b, prop)) ;else if (b[prop] === DELETE) {
    	        delete a[prop];
    	      } else if (a[prop] !== null && b[prop] !== null && _typeof_1(a[prop]) === "object" && _typeof_1(b[prop]) === "object" && !isArray$5(a[prop]) && !isArray$5(b[prop])) {
    	        a[prop] = deepObjectAssignNonentry(a[prop], b[prop]);
    	      } else {
    	        a[prop] = clone(b[prop]);
    	      }
    	    }
    	  } catch (err) {
    	    _iterator.e(err);
    	  } finally {
    	    _iterator.f();
    	  }

    	  return a;
    	}
    	/**
    	 * Deep clone given object or array. In case of primitive simply return.
    	 *
    	 * @param a - Anything.
    	 *
    	 * @returns Deep cloned object/array or unchanged a.
    	 */


    	function clone(a) {
    	  if (isArray$5(a)) {
    	    return map$2(a).call(a, function (value) {
    	      return clone(value);
    	    });
    	  } else if (_typeof_1(a) === "object" && a !== null) {
    	    return deepObjectAssignNonentry({}, a);
    	  } else {
    	    return a;
    	  }
    	}
    	/**
    	 * Strip DELETE from given object.
    	 *
    	 * @param a - Object which may contain DELETE but won't after this is executed.
    	 */


    	function stripDelete(a) {
    	  for (var _i = 0, _Object$keys = keys$3(a); _i < _Object$keys.length; _i++) {
    	    var prop = _Object$keys[_i];

    	    if (a[prop] === DELETE) {
    	      delete a[prop];
    	    } else if (_typeof_1(a[prop]) === "object" && a[prop] !== null) {
    	      stripDelete(a[prop]);
    	    }
    	  }
    	}

    	var nativeConstruct = getBuiltIn('Reflect', 'construct'); // `Reflect.construct` method
    	// https://tc39.github.io/ecma262/#sec-reflect.construct
    	// MS Edge supports only 2 arguments and argumentsList argument is optional
    	// FF Nightly sets third argument as `new.target`, but does not create `this` from it

    	var NEW_TARGET_BUG = fails(function () {
    	  function F() {
    	    /* empty */
    	  }

    	  return !(nativeConstruct(function () {
    	    /* empty */
    	  }, [], F) instanceof F);
    	});
    	var ARGS_BUG = !fails(function () {
    	  nativeConstruct(function () {
    	    /* empty */
    	  });
    	});
    	var FORCED$3 = NEW_TARGET_BUG || ARGS_BUG;
    	_export({
    	  target: 'Reflect',
    	  stat: true,
    	  forced: FORCED$3,
    	  sham: FORCED$3
    	}, {
    	  construct: function construct(Target, args
    	  /* , newTarget */
    	  ) {
    	    aFunction(Target);
    	    anObject(args);
    	    var newTarget = arguments.length < 3 ? Target : aFunction(arguments[2]);
    	    if (ARGS_BUG && !NEW_TARGET_BUG) return nativeConstruct(Target, args, newTarget);

    	    if (Target == newTarget) {
    	      // w/o altered newTarget, optimization for 0-4 arguments
    	      switch (args.length) {
    	        case 0:
    	          return new Target();

    	        case 1:
    	          return new Target(args[0]);

    	        case 2:
    	          return new Target(args[0], args[1]);

    	        case 3:
    	          return new Target(args[0], args[1], args[2]);

    	        case 4:
    	          return new Target(args[0], args[1], args[2], args[3]);
    	      } // w/o altered newTarget, lot of arguments case


    	      var $args = [null];
    	      $args.push.apply($args, args);
    	      return new (functionBind.apply(Target, $args))();
    	    } // with altered newTarget, not support built-in constructors


    	    var proto = newTarget.prototype;
    	    var instance = objectCreate(isObject(proto) ? proto : Object.prototype);
    	    var result = Function.apply.call(Target, instance, args);
    	    return isObject(result) ? result : instance;
    	  }
    	});

    	var construct$1 = path.Reflect.construct;

    	var construct$2 = construct$1;

    	var construct$3 = construct$2;

    	var entries = entryVirtual('Array').entries;

    	var entries$1 = entries;

    	var ArrayPrototype$8 = Array.prototype;
    	var DOMIterables$1 = {
    	  DOMTokenList: true,
    	  NodeList: true
    	};

    	var entries_1 = function (it) {
    	  var own = it.entries;
    	  return it === ArrayPrototype$8 || it instanceof Array && own === ArrayPrototype$8.entries // eslint-disable-next-line no-prototype-builtins
    	  || DOMIterables$1.hasOwnProperty(classof(it)) ? entries$1 : own;
    	};

    	var entries$2 = entries_1;

    	var runtime_1 = createCommonjsModule(function (module) {
    	  /**
    	   * Copyright (c) 2014-present, Facebook, Inc.
    	   *
    	   * This source code is licensed under the MIT license found in the
    	   * LICENSE file in the root directory of this source tree.
    	   */
    	  var runtime = function (exports) {

    	    var Op = Object.prototype;
    	    var hasOwn = Op.hasOwnProperty;
    	    var undefined$1; // More compressible than void 0.

    	    var $Symbol = typeof Symbol === "function" ? Symbol : {};
    	    var iteratorSymbol = $Symbol.iterator || "@@iterator";
    	    var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
    	    var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

    	    function define(obj, key, value) {
    	      Object.defineProperty(obj, key, {
    	        value: value,
    	        enumerable: true,
    	        configurable: true,
    	        writable: true
    	      });
    	      return obj[key];
    	    }

    	    try {
    	      // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    	      define({}, "");
    	    } catch (err) {
    	      define = function (obj, key, value) {
    	        return obj[key] = value;
    	      };
    	    }

    	    function wrap(innerFn, outerFn, self, tryLocsList) {
    	      // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    	      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    	      var generator = Object.create(protoGenerator.prototype);
    	      var context = new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
    	      // .throw, and .return methods.

    	      generator._invoke = makeInvokeMethod(innerFn, self, context);
    	      return generator;
    	    }

    	    exports.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
    	    // record like context.tryEntries[i].completion. This interface could
    	    // have been (and was previously) designed to take a closure to be
    	    // invoked without arguments, but in all the cases we care about we
    	    // already have an existing method we want to call, so there's no need
    	    // to create a new function object. We can even get away with assuming
    	    // the method takes exactly one argument, since that happens to be true
    	    // in every case, so we don't have to touch the arguments object. The
    	    // only additional allocation required is the completion record, which
    	    // has a stable shape and so hopefully should be cheap to allocate.

    	    function tryCatch(fn, obj, arg) {
    	      try {
    	        return {
    	          type: "normal",
    	          arg: fn.call(obj, arg)
    	        };
    	      } catch (err) {
    	        return {
    	          type: "throw",
    	          arg: err
    	        };
    	      }
    	    }

    	    var GenStateSuspendedStart = "suspendedStart";
    	    var GenStateSuspendedYield = "suspendedYield";
    	    var GenStateExecuting = "executing";
    	    var GenStateCompleted = "completed"; // Returning this object from the innerFn has the same effect as
    	    // breaking out of the dispatch switch statement.

    	    var ContinueSentinel = {}; // Dummy constructor functions that we use as the .constructor and
    	    // .constructor.prototype properties for functions that return Generator
    	    // objects. For full spec compliance, you may wish to configure your
    	    // minifier not to mangle the names of these two functions.

    	    function Generator() {}

    	    function GeneratorFunction() {}

    	    function GeneratorFunctionPrototype() {} // This is a polyfill for %IteratorPrototype% for environments that
    	    // don't natively support it.


    	    var IteratorPrototype = {};

    	    IteratorPrototype[iteratorSymbol] = function () {
    	      return this;
    	    };

    	    var getProto = Object.getPrototypeOf;
    	    var NativeIteratorPrototype = getProto && getProto(getProto(values([])));

    	    if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    	      // This environment has a native %IteratorPrototype%; use it instead
    	      // of the polyfill.
    	      IteratorPrototype = NativeIteratorPrototype;
    	    }

    	    var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
    	    GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
    	    GeneratorFunctionPrototype.constructor = GeneratorFunction;
    	    GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"); // Helper for defining the .next, .throw, and .return methods of the
    	    // Iterator interface in terms of a single ._invoke method.

    	    function defineIteratorMethods(prototype) {
    	      ["next", "throw", "return"].forEach(function (method) {
    	        define(prototype, method, function (arg) {
    	          return this._invoke(method, arg);
    	        });
    	      });
    	    }

    	    exports.isGeneratorFunction = function (genFun) {
    	      var ctor = typeof genFun === "function" && genFun.constructor;
    	      return ctor ? ctor === GeneratorFunction || // For the native GeneratorFunction constructor, the best we can
    	      // do is to check its .name property.
    	      (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
    	    };

    	    exports.mark = function (genFun) {
    	      if (Object.setPrototypeOf) {
    	        Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    	      } else {
    	        genFun.__proto__ = GeneratorFunctionPrototype;
    	        define(genFun, toStringTagSymbol, "GeneratorFunction");
    	      }

    	      genFun.prototype = Object.create(Gp);
    	      return genFun;
    	    }; // Within the body of any async function, `await x` is transformed to
    	    // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
    	    // `hasOwn.call(value, "__await")` to determine if the yielded value is
    	    // meant to be awaited.


    	    exports.awrap = function (arg) {
    	      return {
    	        __await: arg
    	      };
    	    };

    	    function AsyncIterator(generator, PromiseImpl) {
    	      function invoke(method, arg, resolve, reject) {
    	        var record = tryCatch(generator[method], generator, arg);

    	        if (record.type === "throw") {
    	          reject(record.arg);
    	        } else {
    	          var result = record.arg;
    	          var value = result.value;

    	          if (value && typeof value === "object" && hasOwn.call(value, "__await")) {
    	            return PromiseImpl.resolve(value.__await).then(function (value) {
    	              invoke("next", value, resolve, reject);
    	            }, function (err) {
    	              invoke("throw", err, resolve, reject);
    	            });
    	          }

    	          return PromiseImpl.resolve(value).then(function (unwrapped) {
    	            // When a yielded Promise is resolved, its final value becomes
    	            // the .value of the Promise<{value,done}> result for the
    	            // current iteration.
    	            result.value = unwrapped;
    	            resolve(result);
    	          }, function (error) {
    	            // If a rejected Promise was yielded, throw the rejection back
    	            // into the async generator function so it can be handled there.
    	            return invoke("throw", error, resolve, reject);
    	          });
    	        }
    	      }

    	      var previousPromise;

    	      function enqueue(method, arg) {
    	        function callInvokeWithMethodAndArg() {
    	          return new PromiseImpl(function (resolve, reject) {
    	            invoke(method, arg, resolve, reject);
    	          });
    	        }

    	        return previousPromise = // If enqueue has been called before, then we want to wait until
    	        // all previous Promises have been resolved before calling invoke,
    	        // so that results are always delivered in the correct order. If
    	        // enqueue has not been called before, then it is important to
    	        // call invoke immediately, without waiting on a callback to fire,
    	        // so that the async generator function has the opportunity to do
    	        // any necessary setup in a predictable way. This predictability
    	        // is why the Promise constructor synchronously invokes its
    	        // executor callback, and why async functions synchronously
    	        // execute code before the first await. Since we implement simple
    	        // async functions in terms of async generators, it is especially
    	        // important to get this right, even though it requires care.
    	        previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
    	        // invocations of the iterator.
    	        callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    	      } // Define the unified helper method that is used to implement .next,
    	      // .throw, and .return (see defineIteratorMethods).


    	      this._invoke = enqueue;
    	    }

    	    defineIteratorMethods(AsyncIterator.prototype);

    	    AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    	      return this;
    	    };

    	    exports.AsyncIterator = AsyncIterator; // Note that simple async functions are implemented on top of
    	    // AsyncIterator objects; they just return a Promise for the value of
    	    // the final result produced by the iterator.

    	    exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    	      if (PromiseImpl === void 0) PromiseImpl = Promise;
    	      var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
    	      return exports.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    	      : iter.next().then(function (result) {
    	        return result.done ? result.value : iter.next();
    	      });
    	    };

    	    function makeInvokeMethod(innerFn, self, context) {
    	      var state = GenStateSuspendedStart;
    	      return function invoke(method, arg) {
    	        if (state === GenStateExecuting) {
    	          throw new Error("Generator is already running");
    	        }

    	        if (state === GenStateCompleted) {
    	          if (method === "throw") {
    	            throw arg;
    	          } // Be forgiving, per 25.3.3.3.3 of the spec:
    	          // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume


    	          return doneResult();
    	        }

    	        context.method = method;
    	        context.arg = arg;

    	        while (true) {
    	          var delegate = context.delegate;

    	          if (delegate) {
    	            var delegateResult = maybeInvokeDelegate(delegate, context);

    	            if (delegateResult) {
    	              if (delegateResult === ContinueSentinel) continue;
    	              return delegateResult;
    	            }
    	          }

    	          if (context.method === "next") {
    	            // Setting context._sent for legacy support of Babel's
    	            // function.sent implementation.
    	            context.sent = context._sent = context.arg;
    	          } else if (context.method === "throw") {
    	            if (state === GenStateSuspendedStart) {
    	              state = GenStateCompleted;
    	              throw context.arg;
    	            }

    	            context.dispatchException(context.arg);
    	          } else if (context.method === "return") {
    	            context.abrupt("return", context.arg);
    	          }

    	          state = GenStateExecuting;
    	          var record = tryCatch(innerFn, self, context);

    	          if (record.type === "normal") {
    	            // If an exception is thrown from innerFn, we leave state ===
    	            // GenStateExecuting and loop back for another invocation.
    	            state = context.done ? GenStateCompleted : GenStateSuspendedYield;

    	            if (record.arg === ContinueSentinel) {
    	              continue;
    	            }

    	            return {
    	              value: record.arg,
    	              done: context.done
    	            };
    	          } else if (record.type === "throw") {
    	            state = GenStateCompleted; // Dispatch the exception by looping back around to the
    	            // context.dispatchException(context.arg) call above.

    	            context.method = "throw";
    	            context.arg = record.arg;
    	          }
    	        }
    	      };
    	    } // Call delegate.iterator[context.method](context.arg) and handle the
    	    // result, either by returning a { value, done } result from the
    	    // delegate iterator, or by modifying context.method and context.arg,
    	    // setting context.delegate to null, and returning the ContinueSentinel.


    	    function maybeInvokeDelegate(delegate, context) {
    	      var method = delegate.iterator[context.method];

    	      if (method === undefined$1) {
    	        // A .throw or .return when the delegate iterator has no .throw
    	        // method always terminates the yield* loop.
    	        context.delegate = null;

    	        if (context.method === "throw") {
    	          // Note: ["return"] must be used for ES3 parsing compatibility.
    	          if (delegate.iterator["return"]) {
    	            // If the delegate iterator has a return method, give it a
    	            // chance to clean up.
    	            context.method = "return";
    	            context.arg = undefined$1;
    	            maybeInvokeDelegate(delegate, context);

    	            if (context.method === "throw") {
    	              // If maybeInvokeDelegate(context) changed context.method from
    	              // "return" to "throw", let that override the TypeError below.
    	              return ContinueSentinel;
    	            }
    	          }

    	          context.method = "throw";
    	          context.arg = new TypeError("The iterator does not provide a 'throw' method");
    	        }

    	        return ContinueSentinel;
    	      }

    	      var record = tryCatch(method, delegate.iterator, context.arg);

    	      if (record.type === "throw") {
    	        context.method = "throw";
    	        context.arg = record.arg;
    	        context.delegate = null;
    	        return ContinueSentinel;
    	      }

    	      var info = record.arg;

    	      if (!info) {
    	        context.method = "throw";
    	        context.arg = new TypeError("iterator result is not an object");
    	        context.delegate = null;
    	        return ContinueSentinel;
    	      }

    	      if (info.done) {
    	        // Assign the result of the finished delegate to the temporary
    	        // variable specified by delegate.resultName (see delegateYield).
    	        context[delegate.resultName] = info.value; // Resume execution at the desired location (see delegateYield).

    	        context.next = delegate.nextLoc; // If context.method was "throw" but the delegate handled the
    	        // exception, let the outer generator proceed normally. If
    	        // context.method was "next", forget context.arg since it has been
    	        // "consumed" by the delegate iterator. If context.method was
    	        // "return", allow the original .return call to continue in the
    	        // outer generator.

    	        if (context.method !== "return") {
    	          context.method = "next";
    	          context.arg = undefined$1;
    	        }
    	      } else {
    	        // Re-yield the result returned by the delegate method.
    	        return info;
    	      } // The delegate iterator is finished, so forget it and continue with
    	      // the outer generator.


    	      context.delegate = null;
    	      return ContinueSentinel;
    	    } // Define Generator.prototype.{next,throw,return} in terms of the
    	    // unified ._invoke helper method.


    	    defineIteratorMethods(Gp);
    	    define(Gp, toStringTagSymbol, "Generator"); // A Generator should always return itself as the iterator object when the
    	    // @@iterator function is called on it. Some browsers' implementations of the
    	    // iterator prototype chain incorrectly implement this, causing the Generator
    	    // object to not be returned from this call. This ensures that doesn't happen.
    	    // See https://github.com/facebook/regenerator/issues/274 for more details.

    	    Gp[iteratorSymbol] = function () {
    	      return this;
    	    };

    	    Gp.toString = function () {
    	      return "[object Generator]";
    	    };

    	    function pushTryEntry(locs) {
    	      var entry = {
    	        tryLoc: locs[0]
    	      };

    	      if (1 in locs) {
    	        entry.catchLoc = locs[1];
    	      }

    	      if (2 in locs) {
    	        entry.finallyLoc = locs[2];
    	        entry.afterLoc = locs[3];
    	      }

    	      this.tryEntries.push(entry);
    	    }

    	    function resetTryEntry(entry) {
    	      var record = entry.completion || {};
    	      record.type = "normal";
    	      delete record.arg;
    	      entry.completion = record;
    	    }

    	    function Context(tryLocsList) {
    	      // The root entry object (effectively a try statement without a catch
    	      // or a finally block) gives us a place to store values thrown from
    	      // locations where there is no enclosing try statement.
    	      this.tryEntries = [{
    	        tryLoc: "root"
    	      }];
    	      tryLocsList.forEach(pushTryEntry, this);
    	      this.reset(true);
    	    }

    	    exports.keys = function (object) {
    	      var keys = [];

    	      for (var key in object) {
    	        keys.push(key);
    	      }

    	      keys.reverse(); // Rather than returning an object with a next method, we keep
    	      // things simple and return the next function itself.

    	      return function next() {
    	        while (keys.length) {
    	          var key = keys.pop();

    	          if (key in object) {
    	            next.value = key;
    	            next.done = false;
    	            return next;
    	          }
    	        } // To avoid creating an additional object, we just hang the .value
    	        // and .done properties off the next function object itself. This
    	        // also ensures that the minifier will not anonymize the function.


    	        next.done = true;
    	        return next;
    	      };
    	    };

    	    function values(iterable) {
    	      if (iterable) {
    	        var iteratorMethod = iterable[iteratorSymbol];

    	        if (iteratorMethod) {
    	          return iteratorMethod.call(iterable);
    	        }

    	        if (typeof iterable.next === "function") {
    	          return iterable;
    	        }

    	        if (!isNaN(iterable.length)) {
    	          var i = -1,
    	              next = function next() {
    	            while (++i < iterable.length) {
    	              if (hasOwn.call(iterable, i)) {
    	                next.value = iterable[i];
    	                next.done = false;
    	                return next;
    	              }
    	            }

    	            next.value = undefined$1;
    	            next.done = true;
    	            return next;
    	          };

    	          return next.next = next;
    	        }
    	      } // Return an iterator with no values.


    	      return {
    	        next: doneResult
    	      };
    	    }

    	    exports.values = values;

    	    function doneResult() {
    	      return {
    	        value: undefined$1,
    	        done: true
    	      };
    	    }

    	    Context.prototype = {
    	      constructor: Context,
    	      reset: function (skipTempReset) {
    	        this.prev = 0;
    	        this.next = 0; // Resetting context._sent for legacy support of Babel's
    	        // function.sent implementation.

    	        this.sent = this._sent = undefined$1;
    	        this.done = false;
    	        this.delegate = null;
    	        this.method = "next";
    	        this.arg = undefined$1;
    	        this.tryEntries.forEach(resetTryEntry);

    	        if (!skipTempReset) {
    	          for (var name in this) {
    	            // Not sure about the optimal order of these conditions:
    	            if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
    	              this[name] = undefined$1;
    	            }
    	          }
    	        }
    	      },
    	      stop: function () {
    	        this.done = true;
    	        var rootEntry = this.tryEntries[0];
    	        var rootRecord = rootEntry.completion;

    	        if (rootRecord.type === "throw") {
    	          throw rootRecord.arg;
    	        }

    	        return this.rval;
    	      },
    	      dispatchException: function (exception) {
    	        if (this.done) {
    	          throw exception;
    	        }

    	        var context = this;

    	        function handle(loc, caught) {
    	          record.type = "throw";
    	          record.arg = exception;
    	          context.next = loc;

    	          if (caught) {
    	            // If the dispatched exception was caught by a catch block,
    	            // then let that catch block handle the exception normally.
    	            context.method = "next";
    	            context.arg = undefined$1;
    	          }

    	          return !!caught;
    	        }

    	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
    	          var entry = this.tryEntries[i];
    	          var record = entry.completion;

    	          if (entry.tryLoc === "root") {
    	            // Exception thrown outside of any try block that could handle
    	            // it, so set the completion value of the entire function to
    	            // throw the exception.
    	            return handle("end");
    	          }

    	          if (entry.tryLoc <= this.prev) {
    	            var hasCatch = hasOwn.call(entry, "catchLoc");
    	            var hasFinally = hasOwn.call(entry, "finallyLoc");

    	            if (hasCatch && hasFinally) {
    	              if (this.prev < entry.catchLoc) {
    	                return handle(entry.catchLoc, true);
    	              } else if (this.prev < entry.finallyLoc) {
    	                return handle(entry.finallyLoc);
    	              }
    	            } else if (hasCatch) {
    	              if (this.prev < entry.catchLoc) {
    	                return handle(entry.catchLoc, true);
    	              }
    	            } else if (hasFinally) {
    	              if (this.prev < entry.finallyLoc) {
    	                return handle(entry.finallyLoc);
    	              }
    	            } else {
    	              throw new Error("try statement without catch or finally");
    	            }
    	          }
    	        }
    	      },
    	      abrupt: function (type, arg) {
    	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
    	          var entry = this.tryEntries[i];

    	          if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
    	            var finallyEntry = entry;
    	            break;
    	          }
    	        }

    	        if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
    	          // Ignore the finally entry if control is not jumping to a
    	          // location outside the try/catch block.
    	          finallyEntry = null;
    	        }

    	        var record = finallyEntry ? finallyEntry.completion : {};
    	        record.type = type;
    	        record.arg = arg;

    	        if (finallyEntry) {
    	          this.method = "next";
    	          this.next = finallyEntry.finallyLoc;
    	          return ContinueSentinel;
    	        }

    	        return this.complete(record);
    	      },
    	      complete: function (record, afterLoc) {
    	        if (record.type === "throw") {
    	          throw record.arg;
    	        }

    	        if (record.type === "break" || record.type === "continue") {
    	          this.next = record.arg;
    	        } else if (record.type === "return") {
    	          this.rval = this.arg = record.arg;
    	          this.method = "return";
    	          this.next = "end";
    	        } else if (record.type === "normal" && afterLoc) {
    	          this.next = afterLoc;
    	        }

    	        return ContinueSentinel;
    	      },
    	      finish: function (finallyLoc) {
    	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
    	          var entry = this.tryEntries[i];

    	          if (entry.finallyLoc === finallyLoc) {
    	            this.complete(entry.completion, entry.afterLoc);
    	            resetTryEntry(entry);
    	            return ContinueSentinel;
    	          }
    	        }
    	      },
    	      "catch": function (tryLoc) {
    	        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
    	          var entry = this.tryEntries[i];

    	          if (entry.tryLoc === tryLoc) {
    	            var record = entry.completion;

    	            if (record.type === "throw") {
    	              var thrown = record.arg;
    	              resetTryEntry(entry);
    	            }

    	            return thrown;
    	          }
    	        } // The context.catch method must only be called with a location
    	        // argument that corresponds to a known catch block.


    	        throw new Error("illegal catch attempt");
    	      },
    	      delegateYield: function (iterable, resultName, nextLoc) {
    	        this.delegate = {
    	          iterator: values(iterable),
    	          resultName: resultName,
    	          nextLoc: nextLoc
    	        };

    	        if (this.method === "next") {
    	          // Deliberately forget the last sent value so that we don't
    	          // accidentally pass it on to the delegate.
    	          this.arg = undefined$1;
    	        }

    	        return ContinueSentinel;
    	      }
    	    }; // Regardless of whether this script is executing as a CommonJS module
    	    // or not, return the runtime object so that we can declare the variable
    	    // regeneratorRuntime in the outer scope, which allows this module to be
    	    // injected easily by `bin/regenerator --include-runtime script.js`.

    	    return exports;
    	  }( // If this script is executing as a CommonJS module, use module.exports
    	  // as the regeneratorRuntime namespace. Otherwise create a new empty
    	  // object. Either way, the resulting object will be used to initialize
    	  // the regeneratorRuntime variable at the top of this file.
    	   module.exports );

    	  try {
    	    regeneratorRuntime = runtime;
    	  } catch (accidentalStrictMode) {
    	    // This module should not be running in strict mode, so the above
    	    // assignment should always work unless something is misconfigured. Just
    	    // in case runtime.js accidentally runs in strict mode, we can escape
    	    // strict mode using a global Function call. This could conceivably fail
    	    // if a Content Security Policy forbids using Function, but in that case
    	    // the proper solution is to fix the accidental strict mode problem. If
    	    // you've misconfigured your bundler to force strict mode and applied a
    	    // CSP to forbid Function, and you're not willing to fix either of those
    	    // problems, please detail your unique predicament in a GitHub issue.
    	    Function("r", "regeneratorRuntime = r")(runtime);
    	  }
    	});

    	var regenerator = runtime_1;

    	var iterator$3 = iterator;

    	var iterator$4 = iterator$3;

    	var $stringify$1 = getBuiltIn('JSON', 'stringify');
    	var re = /[\uD800-\uDFFF]/g;
    	var low = /^[\uD800-\uDBFF]$/;
    	var hi = /^[\uDC00-\uDFFF]$/;

    	var fix = function (match, offset, string) {
    	  var prev = string.charAt(offset - 1);
    	  var next = string.charAt(offset + 1);

    	  if (low.test(match) && !hi.test(next) || hi.test(match) && !low.test(prev)) {
    	    return '\\u' + match.charCodeAt(0).toString(16);
    	  }

    	  return match;
    	};

    	var FORCED$4 = fails(function () {
    	  return $stringify$1('\uDF06\uD834') !== '"\\udf06\\ud834"' || $stringify$1('\uDEAD') !== '"\\udead"';
    	});

    	if ($stringify$1) {
    	  // https://github.com/tc39/proposal-well-formed-stringify
    	  _export({
    	    target: 'JSON',
    	    stat: true,
    	    forced: FORCED$4
    	  }, {
    	    // eslint-disable-next-line no-unused-vars
    	    stringify: function stringify(it, replacer, space) {
    	      var result = $stringify$1.apply(null, arguments);
    	      return typeof result == 'string' ? result.replace(re, fix) : result;
    	    }
    	  });
    	}

    	if (!path.JSON) path.JSON = {
    	  stringify: JSON.stringify
    	}; // eslint-disable-next-line no-unused-vars

    	var stringify = function stringify(it, replacer, space) {
    	  return path.JSON.stringify.apply(null, arguments);
    	};

    	var stringify$1 = stringify;

    	var stringify$2 = stringify$1;

    	var values$1 = entryVirtual('Array').values;

    	var values$2 = values$1;

    	var ArrayPrototype$9 = Array.prototype;
    	var DOMIterables$2 = {
    	  DOMTokenList: true,
    	  NodeList: true
    	};

    	var values_1 = function (it) {
    	  var own = it.values;
    	  return it === ArrayPrototype$9 || it instanceof Array && own === ArrayPrototype$9.values // eslint-disable-next-line no-prototype-builtins
    	  || DOMIterables$2.hasOwnProperty(classof(it)) ? values$2 : own;
    	};

    	var values$3 = values_1;

    	var test$1 = [];
    	var nativeSort = test$1.sort; // IE8-

    	var FAILS_ON_UNDEFINED = fails(function () {
    	  test$1.sort(undefined);
    	}); // V8 bug

    	var FAILS_ON_NULL = fails(function () {
    	  test$1.sort(null);
    	}); // Old WebKit

    	var STRICT_METHOD$3 = arrayMethodIsStrict('sort');
    	var FORCED$5 = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || !STRICT_METHOD$3; // `Array.prototype.sort` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.sort

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: FORCED$5
    	}, {
    	  sort: function sort(comparefn) {
    	    return comparefn === undefined ? nativeSort.call(toObject(this)) : nativeSort.call(toObject(this), aFunction(comparefn));
    	  }
    	});

    	var sort = entryVirtual('Array').sort;

    	var ArrayPrototype$a = Array.prototype;

    	var sort_1 = function (it) {
    	  var own = it.sort;
    	  return it === ArrayPrototype$a || it instanceof Array && own === ArrayPrototype$a.sort ? sort : own;
    	};

    	var sort$1 = sort_1;

    	var sort$2 = sort$1;

    	var keys$4 = entryVirtual('Array').keys;

    	var keys$5 = keys$4;

    	var ArrayPrototype$b = Array.prototype;
    	var DOMIterables$3 = {
    	  DOMTokenList: true,
    	  NodeList: true
    	};

    	var keys_1 = function (it) {
    	  var own = it.keys;
    	  return it === ArrayPrototype$b || it instanceof Array && own === ArrayPrototype$b.keys // eslint-disable-next-line no-prototype-builtins
    	  || DOMIterables$3.hasOwnProperty(classof(it)) ? keys$5 : own;
    	};

    	var keys$6 = keys_1;

    	var $some = arrayIteration.some;
    	var STRICT_METHOD$4 = arrayMethodIsStrict('some');
    	var USES_TO_LENGTH$6 = arrayMethodUsesToLength('some'); // `Array.prototype.some` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.some

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: !STRICT_METHOD$4 || !USES_TO_LENGTH$6
    	}, {
    	  some: function some(callbackfn
    	  /* , thisArg */
    	  ) {
    	    return $some(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    	  }
    	});

    	var some = entryVirtual('Array').some;

    	var ArrayPrototype$c = Array.prototype;

    	var some_1 = function (it) {
    	  var own = it.some;
    	  return it === ArrayPrototype$c || it instanceof Array && own === ArrayPrototype$c.some ? some : own;
    	};

    	var some$1 = some_1;

    	var some$2 = some$1;

    	var freezing = !fails(function () {
    	  return Object.isExtensible(Object.preventExtensions({}));
    	});

    	var internalMetadata = createCommonjsModule(function (module) {
    	  var defineProperty = objectDefineProperty.f;
    	  var METADATA = uid('meta');
    	  var id = 0;

    	  var isExtensible = Object.isExtensible || function () {
    	    return true;
    	  };

    	  var setMetadata = function (it) {
    	    defineProperty(it, METADATA, {
    	      value: {
    	        objectID: 'O' + ++id,
    	        // object ID
    	        weakData: {} // weak collections IDs

    	      }
    	    });
    	  };

    	  var fastKey = function (it, create) {
    	    // return a primitive with prefix
    	    if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;

    	    if (!has(it, METADATA)) {
    	      // can't set metadata to uncaught frozen object
    	      if (!isExtensible(it)) return 'F'; // not necessary to add metadata

    	      if (!create) return 'E'; // add missing metadata

    	      setMetadata(it); // return object ID
    	    }

    	    return it[METADATA].objectID;
    	  };

    	  var getWeakData = function (it, create) {
    	    if (!has(it, METADATA)) {
    	      // can't set metadata to uncaught frozen object
    	      if (!isExtensible(it)) return true; // not necessary to add metadata

    	      if (!create) return false; // add missing metadata

    	      setMetadata(it); // return the store of weak collections IDs
    	    }

    	    return it[METADATA].weakData;
    	  }; // add metadata on freeze-family methods calling


    	  var onFreeze = function (it) {
    	    if (freezing && meta.REQUIRED && isExtensible(it) && !has(it, METADATA)) setMetadata(it);
    	    return it;
    	  };

    	  var meta = module.exports = {
    	    REQUIRED: false,
    	    fastKey: fastKey,
    	    getWeakData: getWeakData,
    	    onFreeze: onFreeze
    	  };
    	  hiddenKeys[METADATA] = true;
    	});

    	var Result = function (stopped, result) {
    	  this.stopped = stopped;
    	  this.result = result;
    	};

    	var iterate = function (iterable, unboundFunction, options) {
    	  var that = options && options.that;
    	  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
    	  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
    	  var INTERRUPTED = !!(options && options.INTERRUPTED);
    	  var fn = functionBindContext(unboundFunction, that, 1 + AS_ENTRIES + INTERRUPTED);
    	  var iterator, iterFn, index, length, result, next, step;

    	  var stop = function (condition) {
    	    if (iterator) iteratorClose(iterator);
    	    return new Result(true, condition);
    	  };

    	  var callFn = function (value) {
    	    if (AS_ENTRIES) {
    	      anObject(value);
    	      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    	    }

    	    return INTERRUPTED ? fn(value, stop) : fn(value);
    	  };

    	  if (IS_ITERATOR) {
    	    iterator = iterable;
    	  } else {
    	    iterFn = getIteratorMethod(iterable);
    	    if (typeof iterFn != 'function') throw TypeError('Target is not iterable'); // optimisation for array iterators

    	    if (isArrayIteratorMethod(iterFn)) {
    	      for (index = 0, length = toLength(iterable.length); length > index; index++) {
    	        result = callFn(iterable[index]);
    	        if (result && result instanceof Result) return result;
    	      }

    	      return new Result(false);
    	    }

    	    iterator = iterFn.call(iterable);
    	  }

    	  next = iterator.next;

    	  while (!(step = next.call(iterator)).done) {
    	    try {
    	      result = callFn(step.value);
    	    } catch (error) {
    	      iteratorClose(iterator);
    	      throw error;
    	    }

    	    if (typeof result == 'object' && result && result instanceof Result) return result;
    	  }

    	  return new Result(false);
    	};

    	var anInstance = function (it, Constructor, name) {
    	  if (!(it instanceof Constructor)) {
    	    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
    	  }

    	  return it;
    	};

    	var defineProperty$9 = objectDefineProperty.f;
    	var forEach$3 = arrayIteration.forEach;
    	var setInternalState$3 = internalState.set;
    	var internalStateGetterFor = internalState.getterFor;

    	var collection = function (CONSTRUCTOR_NAME, wrapper, common) {
    	  var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1;
    	  var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1;
    	  var ADDER = IS_MAP ? 'set' : 'add';
    	  var NativeConstructor = global_1[CONSTRUCTOR_NAME];
    	  var NativePrototype = NativeConstructor && NativeConstructor.prototype;
    	  var exported = {};
    	  var Constructor;

    	  if (!descriptors || typeof NativeConstructor != 'function' || !(IS_WEAK || NativePrototype.forEach && !fails(function () {
    	    new NativeConstructor().entries().next();
    	  }))) {
    	    // create collection constructor
    	    Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
    	    internalMetadata.REQUIRED = true;
    	  } else {
    	    Constructor = wrapper(function (target, iterable) {
    	      setInternalState$3(anInstance(target, Constructor, CONSTRUCTOR_NAME), {
    	        type: CONSTRUCTOR_NAME,
    	        collection: new NativeConstructor()
    	      });
    	      if (iterable != undefined) iterate(iterable, target[ADDER], {
    	        that: target,
    	        AS_ENTRIES: IS_MAP
    	      });
    	    });
    	    var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);
    	    forEach$3(['add', 'clear', 'delete', 'forEach', 'get', 'has', 'set', 'keys', 'values', 'entries'], function (KEY) {
    	      var IS_ADDER = KEY == 'add' || KEY == 'set';

    	      if (KEY in NativePrototype && !(IS_WEAK && KEY == 'clear')) {
    	        createNonEnumerableProperty(Constructor.prototype, KEY, function (a, b) {
    	          var collection = getInternalState(this).collection;
    	          if (!IS_ADDER && IS_WEAK && !isObject(a)) return KEY == 'get' ? undefined : false;
    	          var result = collection[KEY](a === 0 ? 0 : a, b);
    	          return IS_ADDER ? this : result;
    	        });
    	      }
    	    });
    	    IS_WEAK || defineProperty$9(Constructor.prototype, 'size', {
    	      configurable: true,
    	      get: function () {
    	        return getInternalState(this).collection.size;
    	      }
    	    });
    	  }

    	  setToStringTag(Constructor, CONSTRUCTOR_NAME, false, true);
    	  exported[CONSTRUCTOR_NAME] = Constructor;
    	  _export({
    	    global: true,
    	    forced: true
    	  }, exported);
    	  if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);
    	  return Constructor;
    	};

    	var redefineAll = function (target, src, options) {
    	  for (var key in src) {
    	    if (options && options.unsafe && target[key]) target[key] = src[key];else redefine(target, key, src[key], options);
    	  }

    	  return target;
    	};

    	var SPECIES$3 = wellKnownSymbol('species');

    	var setSpecies = function (CONSTRUCTOR_NAME) {
    	  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
    	  var defineProperty = objectDefineProperty.f;

    	  if (descriptors && Constructor && !Constructor[SPECIES$3]) {
    	    defineProperty(Constructor, SPECIES$3, {
    	      configurable: true,
    	      get: function () {
    	        return this;
    	      }
    	    });
    	  }
    	};

    	var defineProperty$a = objectDefineProperty.f;
    	var fastKey = internalMetadata.fastKey;
    	var setInternalState$4 = internalState.set;
    	var internalStateGetterFor$1 = internalState.getterFor;
    	var collectionStrong = {
    	  getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
    	    var C = wrapper(function (that, iterable) {
    	      anInstance(that, C, CONSTRUCTOR_NAME);
    	      setInternalState$4(that, {
    	        type: CONSTRUCTOR_NAME,
    	        index: objectCreate(null),
    	        first: undefined,
    	        last: undefined,
    	        size: 0
    	      });
    	      if (!descriptors) that.size = 0;
    	      if (iterable != undefined) iterate(iterable, that[ADDER], {
    	        that: that,
    	        AS_ENTRIES: IS_MAP
    	      });
    	    });
    	    var getInternalState = internalStateGetterFor$1(CONSTRUCTOR_NAME);

    	    var define = function (that, key, value) {
    	      var state = getInternalState(that);
    	      var entry = getEntry(that, key);
    	      var previous, index; // change existing entry

    	      if (entry) {
    	        entry.value = value; // create new entry
    	      } else {
    	        state.last = entry = {
    	          index: index = fastKey(key, true),
    	          key: key,
    	          value: value,
    	          previous: previous = state.last,
    	          next: undefined,
    	          removed: false
    	        };
    	        if (!state.first) state.first = entry;
    	        if (previous) previous.next = entry;
    	        if (descriptors) state.size++;else that.size++; // add to index

    	        if (index !== 'F') state.index[index] = entry;
    	      }

    	      return that;
    	    };

    	    var getEntry = function (that, key) {
    	      var state = getInternalState(that); // fast case

    	      var index = fastKey(key);
    	      var entry;
    	      if (index !== 'F') return state.index[index]; // frozen object case

    	      for (entry = state.first; entry; entry = entry.next) {
    	        if (entry.key == key) return entry;
    	      }
    	    };

    	    redefineAll(C.prototype, {
    	      // 23.1.3.1 Map.prototype.clear()
    	      // 23.2.3.2 Set.prototype.clear()
    	      clear: function clear() {
    	        var that = this;
    	        var state = getInternalState(that);
    	        var data = state.index;
    	        var entry = state.first;

    	        while (entry) {
    	          entry.removed = true;
    	          if (entry.previous) entry.previous = entry.previous.next = undefined;
    	          delete data[entry.index];
    	          entry = entry.next;
    	        }

    	        state.first = state.last = undefined;
    	        if (descriptors) state.size = 0;else that.size = 0;
    	      },
    	      // 23.1.3.3 Map.prototype.delete(key)
    	      // 23.2.3.4 Set.prototype.delete(value)
    	      'delete': function (key) {
    	        var that = this;
    	        var state = getInternalState(that);
    	        var entry = getEntry(that, key);

    	        if (entry) {
    	          var next = entry.next;
    	          var prev = entry.previous;
    	          delete state.index[entry.index];
    	          entry.removed = true;
    	          if (prev) prev.next = next;
    	          if (next) next.previous = prev;
    	          if (state.first == entry) state.first = next;
    	          if (state.last == entry) state.last = prev;
    	          if (descriptors) state.size--;else that.size--;
    	        }

    	        return !!entry;
    	      },
    	      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
    	      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
    	      forEach: function forEach(callbackfn
    	      /* , that = undefined */
    	      ) {
    	        var state = getInternalState(this);
    	        var boundFunction = functionBindContext(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
    	        var entry;

    	        while (entry = entry ? entry.next : state.first) {
    	          boundFunction(entry.value, entry.key, this); // revert to the last existing entry

    	          while (entry && entry.removed) entry = entry.previous;
    	        }
    	      },
    	      // 23.1.3.7 Map.prototype.has(key)
    	      // 23.2.3.7 Set.prototype.has(value)
    	      has: function has(key) {
    	        return !!getEntry(this, key);
    	      }
    	    });
    	    redefineAll(C.prototype, IS_MAP ? {
    	      // 23.1.3.6 Map.prototype.get(key)
    	      get: function get(key) {
    	        var entry = getEntry(this, key);
    	        return entry && entry.value;
    	      },
    	      // 23.1.3.9 Map.prototype.set(key, value)
    	      set: function set(key, value) {
    	        return define(this, key === 0 ? 0 : key, value);
    	      }
    	    } : {
    	      // 23.2.3.1 Set.prototype.add(value)
    	      add: function add(value) {
    	        return define(this, value = value === 0 ? 0 : value, value);
    	      }
    	    });
    	    if (descriptors) defineProperty$a(C.prototype, 'size', {
    	      get: function () {
    	        return getInternalState(this).size;
    	      }
    	    });
    	    return C;
    	  },
    	  setStrong: function (C, CONSTRUCTOR_NAME, IS_MAP) {
    	    var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator';
    	    var getInternalCollectionState = internalStateGetterFor$1(CONSTRUCTOR_NAME);
    	    var getInternalIteratorState = internalStateGetterFor$1(ITERATOR_NAME); // add .keys, .values, .entries, [@@iterator]
    	    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11

    	    defineIterator(C, CONSTRUCTOR_NAME, function (iterated, kind) {
    	      setInternalState$4(this, {
    	        type: ITERATOR_NAME,
    	        target: iterated,
    	        state: getInternalCollectionState(iterated),
    	        kind: kind,
    	        last: undefined
    	      });
    	    }, function () {
    	      var state = getInternalIteratorState(this);
    	      var kind = state.kind;
    	      var entry = state.last; // revert to the last existing entry

    	      while (entry && entry.removed) entry = entry.previous; // get next entry


    	      if (!state.target || !(state.last = entry = entry ? entry.next : state.state.first)) {
    	        // or finish the iteration
    	        state.target = undefined;
    	        return {
    	          value: undefined,
    	          done: true
    	        };
    	      } // return step by kind


    	      if (kind == 'keys') return {
    	        value: entry.key,
    	        done: false
    	      };
    	      if (kind == 'values') return {
    	        value: entry.value,
    	        done: false
    	      };
    	      return {
    	        value: [entry.key, entry.value],
    	        done: false
    	      };
    	    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true); // add [@@species], 23.1.2.2, 23.2.2.2

    	    setSpecies(CONSTRUCTOR_NAME);
    	  }
    	};

    	// https://tc39.github.io/ecma262/#sec-map-objects


    	var es_map = collection('Map', function (init) {
    	  return function Map() {
    	    return init(this, arguments.length ? arguments[0] : undefined);
    	  };
    	}, collectionStrong);

    	var map$3 = path.Map;

    	var map$4 = map$3;

    	var map$5 = map$4;

    	var create$3 = create;

    	var create$4 = create$3;

    	// https://tc39.github.io/ecma262/#sec-object.setprototypeof

    	_export({
    	  target: 'Object',
    	  stat: true
    	}, {
    	  setPrototypeOf: objectSetPrototypeOf
    	});

    	var setPrototypeOf = path.Object.setPrototypeOf;

    	var setPrototypeOf$1 = setPrototypeOf;

    	var setPrototypeOf$2 = setPrototypeOf$1;

    	var setPrototypeOf$3 = createCommonjsModule(function (module) {
    	  function _setPrototypeOf(o, p) {
    	    module.exports = _setPrototypeOf = setPrototypeOf$2 || function _setPrototypeOf(o, p) {
    	      o.__proto__ = p;
    	      return o;
    	    };

    	    return _setPrototypeOf(o, p);
    	  }

    	  module.exports = _setPrototypeOf;
    	});

    	function _inherits(subClass, superClass) {
    	  if (typeof superClass !== "function" && superClass !== null) {
    	    throw new TypeError("Super expression must either be null or a function");
    	  }

    	  subClass.prototype = create$4(superClass && superClass.prototype, {
    	    constructor: {
    	      value: subClass,
    	      writable: true,
    	      configurable: true
    	    }
    	  });
    	  if (superClass) setPrototypeOf$3(subClass, superClass);
    	}

    	var inherits = _inherits;

    	function _assertThisInitialized(self) {
    	  if (self === void 0) {
    	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    	  }

    	  return self;
    	}

    	var assertThisInitialized = _assertThisInitialized;

    	function _possibleConstructorReturn(self, call) {
    	  if (call && (_typeof_1(call) === "object" || typeof call === "function")) {
    	    return call;
    	  }

    	  return assertThisInitialized(self);
    	}

    	var possibleConstructorReturn = _possibleConstructorReturn;

    	var getPrototypeOf$1 = getPrototypeOf;

    	var getPrototypeOf$2 = getPrototypeOf$1;

    	var getPrototypeOf$3 = createCommonjsModule(function (module) {
    	  function _getPrototypeOf(o) {
    	    module.exports = _getPrototypeOf = setPrototypeOf$2 ? getPrototypeOf$2 : function _getPrototypeOf(o) {
    	      return o.__proto__ || getPrototypeOf$2(o);
    	    };
    	    return _getPrototypeOf(o);
    	  }

    	  module.exports = _getPrototypeOf;
    	});

    	// Unique ID creation requires a high quality random # generator. In the browser we therefore
    	// require the crypto API and do not support built-in fallback to lower quality random number
    	// generators (like Math.random()).
    	// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    	// find the complete implementation of crypto (msCrypto) on IE11.
    	var getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);
    	var rnds8 = new Uint8Array(16);
    	function rng() {
    	  if (!getRandomValues) {
    	    throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    	  }

    	  return getRandomValues(rnds8);
    	}

    	var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

    	function validate(uuid) {
    	  return typeof uuid === 'string' && REGEX.test(uuid);
    	}

    	/**
    	 * Convert array of 16 byte values to UUID string format of the form:
    	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    	 */

    	var byteToHex = [];

    	for (var i = 0; i < 256; ++i) {
    	  byteToHex.push((i + 0x100).toString(16).substr(1));
    	}

    	function stringify$3(arr) {
    	  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0; // Note: Be careful editing this code!  It's been tuned for performance
    	  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434

    	  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
    	  // of the following:
    	  // - One or more input array values don't map to a hex octet (leading to
    	  // "undefined" in the uuid)
    	  // - Invalid input values for the RFC `version` or `variant` fields

    	  if (!validate(uuid)) {
    	    throw TypeError('Stringified UUID is invalid');
    	  }

    	  return uuid;
    	}

    	function v4(options, buf, offset) {
    	  options = options || {};
    	  var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

    	  rnds[6] = rnds[6] & 0x0f | 0x40;
    	  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

    	  if (buf) {
    	    offset = offset || 0;

    	    for (var i = 0; i < 16; ++i) {
    	      buf[offset + i] = rnds[i];
    	    }

    	    return buf;
    	  }

    	  return stringify$3(rnds);
    	}

    	/**
    	 * Determine whether a value can be used as an id.
    	 *
    	 * @param value - Input value of unknown type.
    	 *
    	 * @returns True if the value is valid id, false otherwise.
    	 */
    	function isId(value) {
    	  return typeof value === "string" || typeof value === "number";
    	}

    	var HAS_SPECIES_SUPPORT$3 = arrayMethodHasSpeciesSupport('splice');
    	var USES_TO_LENGTH$7 = arrayMethodUsesToLength('splice', {
    	  ACCESSORS: true,
    	  0: 0,
    	  1: 2
    	});
    	var max$2 = Math.max;
    	var min$2 = Math.min;
    	var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
    	var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded'; // `Array.prototype.splice` method
    	// https://tc39.github.io/ecma262/#sec-array.prototype.splice
    	// with adding support of @@species

    	_export({
    	  target: 'Array',
    	  proto: true,
    	  forced: !HAS_SPECIES_SUPPORT$3 || !USES_TO_LENGTH$7
    	}, {
    	  splice: function splice(start, deleteCount
    	  /* , ...items */
    	  ) {
    	    var O = toObject(this);
    	    var len = toLength(O.length);
    	    var actualStart = toAbsoluteIndex(start, len);
    	    var argumentsLength = arguments.length;
    	    var insertCount, actualDeleteCount, A, k, from, to;

    	    if (argumentsLength === 0) {
    	      insertCount = actualDeleteCount = 0;
    	    } else if (argumentsLength === 1) {
    	      insertCount = 0;
    	      actualDeleteCount = len - actualStart;
    	    } else {
    	      insertCount = argumentsLength - 2;
    	      actualDeleteCount = min$2(max$2(toInteger(deleteCount), 0), len - actualStart);
    	    }

    	    if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER$1) {
    	      throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
    	    }

    	    A = arraySpeciesCreate(O, actualDeleteCount);

    	    for (k = 0; k < actualDeleteCount; k++) {
    	      from = actualStart + k;
    	      if (from in O) createProperty(A, k, O[from]);
    	    }

    	    A.length = actualDeleteCount;

    	    if (insertCount < actualDeleteCount) {
    	      for (k = actualStart; k < len - actualDeleteCount; k++) {
    	        from = k + actualDeleteCount;
    	        to = k + insertCount;
    	        if (from in O) O[to] = O[from];else delete O[to];
    	      }

    	      for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
    	    } else if (insertCount > actualDeleteCount) {
    	      for (k = len - actualDeleteCount; k > actualStart; k--) {
    	        from = k + actualDeleteCount - 1;
    	        to = k + insertCount - 1;
    	        if (from in O) O[to] = O[from];else delete O[to];
    	      }
    	    }

    	    for (k = 0; k < insertCount; k++) {
    	      O[k + actualStart] = arguments[k + 2];
    	    }

    	    O.length = len - actualDeleteCount + insertCount;
    	    return A;
    	  }
    	});

    	var splice = entryVirtual('Array').splice;

    	var ArrayPrototype$d = Array.prototype;

    	var splice_1 = function (it) {
    	  var own = it.splice;
    	  return it === ArrayPrototype$d || it instanceof Array && own === ArrayPrototype$d.splice ? splice : own;
    	};

    	var splice$1 = splice_1;

    	var splice$2 = splice$1;

    	var slice$6 = [].slice;
    	var MSIE = /MSIE .\./.test(engineUserAgent); // <- dirty ie9- check

    	var wrap$1 = function (scheduler) {
    	  return function (handler, timeout
    	  /* , ...arguments */
    	  ) {
    	    var boundArgs = arguments.length > 2;
    	    var args = boundArgs ? slice$6.call(arguments, 2) : undefined;
    	    return scheduler(boundArgs ? function () {
    	      // eslint-disable-next-line no-new-func
    	      (typeof handler == 'function' ? handler : Function(handler)).apply(this, args);
    	    } : handler, timeout);
    	  };
    	}; // ie9- setTimeout & setInterval additional parameters fix
    	// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers


    	_export({
    	  global: true,
    	  bind: true,
    	  forced: MSIE
    	}, {
    	  // `setTimeout` method
    	  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
    	  setTimeout: wrap$1(global_1.setTimeout),
    	  // `setInterval` method
    	  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
    	  setInterval: wrap$1(global_1.setInterval)
    	});

    	var setTimeout = path.setTimeout;

    	var setTimeout$1 = setTimeout;

    	/**
    	 * A queue.
    	 *
    	 * @typeParam T - The type of method names to be replaced by queued versions.
    	 */
    	var Queue = /*#__PURE__*/function () {
    	  /**
    	   * Construct a new Queue.
    	   *
    	   * @param options - Queue configuration.
    	   */
    	  function Queue(options) {
    	    classCallCheck(this, Queue);

    	    this._queue = [];
    	    this._timeout = null;
    	    this._extended = null; // options

    	    this.delay = null;
    	    this.max = Infinity;
    	    this.setOptions(options);
    	  }
    	  /**
    	   * Update the configuration of the queue.
    	   *
    	   * @param options - Queue configuration.
    	   */


    	  createClass(Queue, [{
    	    key: "setOptions",
    	    value: function setOptions(options) {
    	      if (options && typeof options.delay !== "undefined") {
    	        this.delay = options.delay;
    	      }

    	      if (options && typeof options.max !== "undefined") {
    	        this.max = options.max;
    	      }

    	      this._flushIfNeeded();
    	    }
    	    /**
    	     * Extend an object with queuing functionality.
    	     * The object will be extended with a function flush, and the methods provided in options.replace will be replaced with queued ones.
    	     *
    	     * @param object - The object to be extended.
    	     * @param options - Additional options.
    	     *
    	     * @returns The created queue.
    	     */

    	  }, {
    	    key: "destroy",

    	    /**
    	     * Destroy the queue. The queue will first flush all queued actions, and in case it has extended an object, will restore the original object.
    	     */
    	    value: function destroy() {
    	      this.flush();

    	      if (this._extended) {
    	        var object = this._extended.object;
    	        var methods = this._extended.methods;

    	        for (var i = 0; i < methods.length; i++) {
    	          var method = methods[i];

    	          if (method.original) {
    	            // @TODO: better solution?
    	            object[method.name] = method.original;
    	          } else {
    	            // @TODO: better solution?
    	            delete object[method.name];
    	          }
    	        }

    	        this._extended = null;
    	      }
    	    }
    	    /**
    	     * Replace a method on an object with a queued version.
    	     *
    	     * @param object - Object having the method.
    	     * @param method - The method name.
    	     */

    	  }, {
    	    key: "replace",
    	    value: function replace(object, method) {
    	      /* eslint-disable-next-line @typescript-eslint/no-this-alias -- Function this is necessary in the function bellow, so class this has to be saved into a variable here. */
    	      var me = this;
    	      var original = object[method];

    	      if (!original) {
    	        throw new Error("Method " + method + " undefined");
    	      }

    	      object[method] = function () {
    	        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    	          args[_key] = arguments[_key];
    	        }

    	        // add this call to the queue
    	        me.queue({
    	          args: args,
    	          fn: original,
    	          context: this
    	        });
    	      };
    	    }
    	    /**
    	     * Queue a call.
    	     *
    	     * @param entry - The function or entry to be queued.
    	     */

    	  }, {
    	    key: "queue",
    	    value: function queue(entry) {
    	      if (typeof entry === "function") {
    	        this._queue.push({
    	          fn: entry
    	        });
    	      } else {
    	        this._queue.push(entry);
    	      }

    	      this._flushIfNeeded();
    	    }
    	    /**
    	     * Check whether the queue needs to be flushed.
    	     */

    	  }, {
    	    key: "_flushIfNeeded",
    	    value: function _flushIfNeeded() {
    	      var _this = this;

    	      // flush when the maximum is exceeded.
    	      if (this._queue.length > this.max) {
    	        this.flush();
    	      } // flush after a period of inactivity when a delay is configured


    	      if (this._timeout != null) {
    	        clearTimeout(this._timeout);
    	        this._timeout = null;
    	      }

    	      if (this.queue.length > 0 && typeof this.delay === "number") {
    	        this._timeout = setTimeout$1(function () {
    	          _this.flush();
    	        }, this.delay);
    	      }
    	    }
    	    /**
    	     * Flush all queued calls
    	     */

    	  }, {
    	    key: "flush",
    	    value: function flush() {
    	      var _context, _context2;

    	      forEach$2(_context = splice$2(_context2 = this._queue).call(_context2, 0)).call(_context, function (entry) {
    	        entry.fn.apply(entry.context || entry.fn, entry.args || []);
    	      });
    	    }
    	  }], [{
    	    key: "extend",
    	    value: function extend(object, options) {
    	      var queue = new Queue(options);

    	      if (object.flush !== undefined) {
    	        throw new Error("Target object already has a property flush");
    	      }

    	      object.flush = function () {
    	        queue.flush();
    	      };

    	      var methods = [{
    	        name: "flush",
    	        original: undefined
    	      }];

    	      if (options && options.replace) {
    	        for (var i = 0; i < options.replace.length; i++) {
    	          var name = options.replace[i];
    	          methods.push({
    	            name: name,
    	            // @TODO: better solution?
    	            original: object[name]
    	          }); // @TODO: better solution?

    	          queue.replace(object, name);
    	        }
    	      }

    	      queue._extended = {
    	        object: object,
    	        methods: methods
    	      };
    	      return queue;
    	    }
    	  }]);

    	  return Queue;
    	}();

    	/**
    	 * [[DataSet]] code that can be reused in [[DataView]] or other similar implementations of [[DataInterface]].
    	 *
    	 * @typeParam Item - Item type that may or may not have an id.
    	 * @typeParam IdProp - Name of the property that contains the id.
    	 */
    	var DataSetPart = /*#__PURE__*/function () {
    	  function DataSetPart() {
    	    classCallCheck(this, DataSetPart);

    	    this._subscribers = {
    	      "*": [],
    	      add: [],
    	      remove: [],
    	      update: []
    	    };
    	    /**
    	     * @deprecated Use on instead (PS: DataView.subscribe === DataView.on).
    	     */

    	    this.subscribe = DataSetPart.prototype.on;
    	    /**
    	     * @deprecated Use off instead (PS: DataView.unsubscribe === DataView.off).
    	     */

    	    this.unsubscribe = DataSetPart.prototype.off;
    	  }
    	  /**
    	   * Trigger an event
    	   *
    	   * @param event - Event name.
    	   * @param payload - Event payload.
    	   * @param senderId - Id of the sender.
    	   */


    	  createClass(DataSetPart, [{
    	    key: "_trigger",
    	    value: function _trigger(event, payload, senderId) {
    	      var _context, _context2;

    	      if (event === "*") {
    	        throw new Error("Cannot trigger event *");
    	      }

    	      forEach$2(_context = concat$2(_context2 = []).call(_context2, toConsumableArray(this._subscribers[event]), toConsumableArray(this._subscribers["*"]))).call(_context, function (subscriber) {
    	        subscriber(event, payload, senderId != null ? senderId : null);
    	      });
    	    }
    	    /**
    	     * Subscribe to an event, add an event listener.
    	     *
    	     * @remarks Non-function callbacks are ignored.
    	     *
    	     * @param event - Event name.
    	     * @param callback - Callback method.
    	     */

    	  }, {
    	    key: "on",
    	    value: function on(event, callback) {
    	      if (typeof callback === "function") {
    	        this._subscribers[event].push(callback);
    	      } // @TODO: Maybe throw for invalid callbacks?

    	    }
    	    /**
    	     * Unsubscribe from an event, remove an event listener.
    	     *
    	     * @remarks If the same callback was subscribed more than once **all** occurences will be removed.
    	     *
    	     * @param event - Event name.
    	     * @param callback - Callback method.
    	     */

    	  }, {
    	    key: "off",
    	    value: function off(event, callback) {
    	      var _context3;

    	      this._subscribers[event] = filter$2(_context3 = this._subscribers[event]).call(_context3, function (subscriber) {
    	        return subscriber !== callback;
    	      });
    	    }
    	  }]);

    	  return DataSetPart;
    	}();

    	// https://tc39.github.io/ecma262/#sec-set-objects


    	var es_set = collection('Set', function (init) {
    	  return function Set() {
    	    return init(this, arguments.length ? arguments[0] : undefined);
    	  };
    	}, collectionStrong);

    	var set$1 = path.Set;

    	var set$2 = set$1;

    	var set$3 = set$2;

    	function _createForOfIteratorHelper$1(o, allowArrayLike) { var it; if (typeof symbol$4 === "undefined" || getIteratorMethod$1(o) == null) { if (isArray$5(o) || (it = _unsupportedIterableToArray$2(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = getIterator$1(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

    	function _unsupportedIterableToArray$2(o, minLen) { var _context10; if (!o) return; if (typeof o === "string") return _arrayLikeToArray$2(o, minLen); var n = slice$5(_context10 = Object.prototype.toString.call(o)).call(_context10, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return from_1$2(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$2(o, minLen); }

    	function _arrayLikeToArray$2(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    	/**
    	 * Data stream
    	 *
    	 * @remarks
    	 * [[DataStream]] offers an always up to date stream of items from a [[DataSet]] or [[DataView]].
    	 * That means that the stream is evaluated at the time of iteration, conversion to another data type or when [[cache]] is called, not when the [[DataStream]] was created.
    	 * Multiple invocations of for example [[toItemArray]] may yield different results (if the data source like for example [[DataSet]] gets modified).
    	 *
    	 * @typeParam Item - The item type this stream is going to work with.
    	 */
    	var DataStream = /*#__PURE__*/function () {
    	  /**
    	   * Create a new data stream.
    	   *
    	   * @param pairs - The id, item pairs.
    	   */
    	  function DataStream(pairs) {
    	    classCallCheck(this, DataStream);

    	    this._pairs = pairs;
    	  }
    	  /**
    	   * Return an iterable of key, value pairs for every entry in the stream.
    	   */


    	  createClass(DataStream, [{
    	    key: iterator$4,
    	    value: /*#__PURE__*/regenerator.mark(function value() {
    	      var _iterator, _step, _step$value, id, item;

    	      return regenerator.wrap(function value$(_context) {
    	        while (1) {
    	          switch (_context.prev = _context.next) {
    	            case 0:
    	              _iterator = _createForOfIteratorHelper$1(this._pairs);
    	              _context.prev = 1;

    	              _iterator.s();

    	            case 3:
    	              if ((_step = _iterator.n()).done) {
    	                _context.next = 9;
    	                break;
    	              }

    	              _step$value = slicedToArray(_step.value, 2), id = _step$value[0], item = _step$value[1];
    	              _context.next = 7;
    	              return [id, item];

    	            case 7:
    	              _context.next = 3;
    	              break;

    	            case 9:
    	              _context.next = 14;
    	              break;

    	            case 11:
    	              _context.prev = 11;
    	              _context.t0 = _context["catch"](1);

    	              _iterator.e(_context.t0);

    	            case 14:
    	              _context.prev = 14;

    	              _iterator.f();

    	              return _context.finish(14);

    	            case 17:
    	            case "end":
    	              return _context.stop();
    	          }
    	        }
    	      }, value, this, [[1, 11, 14, 17]]);
    	    })
    	    /**
    	     * Return an iterable of key, value pairs for every entry in the stream.
    	     */

    	  }, {
    	    key: "entries",
    	    value: /*#__PURE__*/regenerator.mark(function entries() {
    	      var _iterator2, _step2, _step2$value, id, item;

    	      return regenerator.wrap(function entries$(_context2) {
    	        while (1) {
    	          switch (_context2.prev = _context2.next) {
    	            case 0:
    	              _iterator2 = _createForOfIteratorHelper$1(this._pairs);
    	              _context2.prev = 1;

    	              _iterator2.s();

    	            case 3:
    	              if ((_step2 = _iterator2.n()).done) {
    	                _context2.next = 9;
    	                break;
    	              }

    	              _step2$value = slicedToArray(_step2.value, 2), id = _step2$value[0], item = _step2$value[1];
    	              _context2.next = 7;
    	              return [id, item];

    	            case 7:
    	              _context2.next = 3;
    	              break;

    	            case 9:
    	              _context2.next = 14;
    	              break;

    	            case 11:
    	              _context2.prev = 11;
    	              _context2.t0 = _context2["catch"](1);

    	              _iterator2.e(_context2.t0);

    	            case 14:
    	              _context2.prev = 14;

    	              _iterator2.f();

    	              return _context2.finish(14);

    	            case 17:
    	            case "end":
    	              return _context2.stop();
    	          }
    	        }
    	      }, entries, this, [[1, 11, 14, 17]]);
    	    })
    	    /**
    	     * Return an iterable of keys in the stream.
    	     */

    	  }, {
    	    key: "keys",
    	    value: /*#__PURE__*/regenerator.mark(function keys() {
    	      var _iterator3, _step3, _step3$value, id;

    	      return regenerator.wrap(function keys$(_context3) {
    	        while (1) {
    	          switch (_context3.prev = _context3.next) {
    	            case 0:
    	              _iterator3 = _createForOfIteratorHelper$1(this._pairs);
    	              _context3.prev = 1;

    	              _iterator3.s();

    	            case 3:
    	              if ((_step3 = _iterator3.n()).done) {
    	                _context3.next = 9;
    	                break;
    	              }

    	              _step3$value = slicedToArray(_step3.value, 1), id = _step3$value[0];
    	              _context3.next = 7;
    	              return id;

    	            case 7:
    	              _context3.next = 3;
    	              break;

    	            case 9:
    	              _context3.next = 14;
    	              break;

    	            case 11:
    	              _context3.prev = 11;
    	              _context3.t0 = _context3["catch"](1);

    	              _iterator3.e(_context3.t0);

    	            case 14:
    	              _context3.prev = 14;

    	              _iterator3.f();

    	              return _context3.finish(14);

    	            case 17:
    	            case "end":
    	              return _context3.stop();
    	          }
    	        }
    	      }, keys, this, [[1, 11, 14, 17]]);
    	    })
    	    /**
    	     * Return an iterable of values in the stream.
    	     */

    	  }, {
    	    key: "values",
    	    value: /*#__PURE__*/regenerator.mark(function values() {
    	      var _iterator4, _step4, _step4$value, item;

    	      return regenerator.wrap(function values$(_context4) {
    	        while (1) {
    	          switch (_context4.prev = _context4.next) {
    	            case 0:
    	              _iterator4 = _createForOfIteratorHelper$1(this._pairs);
    	              _context4.prev = 1;

    	              _iterator4.s();

    	            case 3:
    	              if ((_step4 = _iterator4.n()).done) {
    	                _context4.next = 9;
    	                break;
    	              }

    	              _step4$value = slicedToArray(_step4.value, 2), item = _step4$value[1];
    	              _context4.next = 7;
    	              return item;

    	            case 7:
    	              _context4.next = 3;
    	              break;

    	            case 9:
    	              _context4.next = 14;
    	              break;

    	            case 11:
    	              _context4.prev = 11;
    	              _context4.t0 = _context4["catch"](1);

    	              _iterator4.e(_context4.t0);

    	            case 14:
    	              _context4.prev = 14;

    	              _iterator4.f();

    	              return _context4.finish(14);

    	            case 17:
    	            case "end":
    	              return _context4.stop();
    	          }
    	        }
    	      }, values, this, [[1, 11, 14, 17]]);
    	    })
    	    /**
    	     * Return an array containing all the ids in this stream.
    	     *
    	     * @remarks
    	     * The array may contain duplicities.
    	     *
    	     * @returns The array with all ids from this stream.
    	     */

    	  }, {
    	    key: "toIdArray",
    	    value: function toIdArray() {
    	      var _context5;

    	      return map$2(_context5 = toConsumableArray(this._pairs)).call(_context5, function (pair) {
    	        return pair[0];
    	      });
    	    }
    	    /**
    	     * Return an array containing all the items in this stream.
    	     *
    	     * @remarks
    	     * The array may contain duplicities.
    	     *
    	     * @returns The array with all items from this stream.
    	     */

    	  }, {
    	    key: "toItemArray",
    	    value: function toItemArray() {
    	      var _context6;

    	      return map$2(_context6 = toConsumableArray(this._pairs)).call(_context6, function (pair) {
    	        return pair[1];
    	      });
    	    }
    	    /**
    	     * Return an array containing all the entries in this stream.
    	     *
    	     * @remarks
    	     * The array may contain duplicities.
    	     *
    	     * @returns The array with all entries from this stream.
    	     */

    	  }, {
    	    key: "toEntryArray",
    	    value: function toEntryArray() {
    	      return toConsumableArray(this._pairs);
    	    }
    	    /**
    	     * Return an object map containing all the items in this stream accessible by ids.
    	     *
    	     * @remarks
    	     * In case of duplicate ids (coerced to string so `7 == '7'`) the last encoutered appears in the returned object.
    	     *
    	     * @returns The object map of all id → item pairs from this stream.
    	     */

    	  }, {
    	    key: "toObjectMap",
    	    value: function toObjectMap() {
    	      var map = create$2(null);

    	      var _iterator5 = _createForOfIteratorHelper$1(this._pairs),
    	          _step5;

    	      try {
    	        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
    	          var _step5$value = slicedToArray(_step5.value, 2),
    	              id = _step5$value[0],
    	              item = _step5$value[1];

    	          map[id] = item;
    	        }
    	      } catch (err) {
    	        _iterator5.e(err);
    	      } finally {
    	        _iterator5.f();
    	      }

    	      return map;
    	    }
    	    /**
    	     * Return a map containing all the items in this stream accessible by ids.
    	     *
    	     * @returns The map of all id → item pairs from this stream.
    	     */

    	  }, {
    	    key: "toMap",
    	    value: function toMap() {
    	      return new map$5(this._pairs);
    	    }
    	    /**
    	     * Return a set containing all the (unique) ids in this stream.
    	     *
    	     * @returns The set of all ids from this stream.
    	     */

    	  }, {
    	    key: "toIdSet",
    	    value: function toIdSet() {
    	      return new set$3(this.toIdArray());
    	    }
    	    /**
    	     * Return a set containing all the (unique) items in this stream.
    	     *
    	     * @returns The set of all items from this stream.
    	     */

    	  }, {
    	    key: "toItemSet",
    	    value: function toItemSet() {
    	      return new set$3(this.toItemArray());
    	    }
    	    /**
    	     * Cache the items from this stream.
    	     *
    	     * @remarks
    	     * This method allows for items to be fetched immediatelly and used (possibly multiple times) later.
    	     * It can also be used to optimize performance as [[DataStream]] would otherwise reevaluate everything upon each iteration.
    	     *
    	     * ## Example
    	     * ```javascript
    	     * const ds = new DataSet([…])
    	     *
    	     * const cachedStream = ds.stream()
    	     *   .filter(…)
    	     *   .sort(…)
    	     *   .map(…)
    	     *   .cached(…) // Data are fetched, processed and cached here.
    	     *
    	     * ds.clear()
    	     * chachedStream // Still has all the items.
    	     * ```
    	     *
    	     * @returns A new [[DataStream]] with cached items (detached from the original [[DataSet]]).
    	     */

    	  }, {
    	    key: "cache",
    	    value: function cache() {
    	      return new DataStream(toConsumableArray(this._pairs));
    	    }
    	    /**
    	     * Get the distinct values of given property.
    	     *
    	     * @param callback - The function that picks and possibly converts the property.
    	     *
    	     * @typeParam T - The type of the distinct value.
    	     *
    	     * @returns A set of all distinct properties.
    	     */

    	  }, {
    	    key: "distinct",
    	    value: function distinct(callback) {
    	      var set = new set$3();

    	      var _iterator6 = _createForOfIteratorHelper$1(this._pairs),
    	          _step6;

    	      try {
    	        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
    	          var _step6$value = slicedToArray(_step6.value, 2),
    	              id = _step6$value[0],
    	              item = _step6$value[1];

    	          set.add(callback(item, id));
    	        }
    	      } catch (err) {
    	        _iterator6.e(err);
    	      } finally {
    	        _iterator6.f();
    	      }

    	      return set;
    	    }
    	    /**
    	     * Filter the items of the stream.
    	     *
    	     * @param callback - The function that decides whether an item will be included.
    	     *
    	     * @returns A new data stream with the filtered items.
    	     */

    	  }, {
    	    key: "filter",
    	    value: function filter(callback) {
    	      var pairs = this._pairs;
    	      return new DataStream(defineProperty$7({}, iterator$4, /*#__PURE__*/regenerator.mark(function _callee() {
    	        var _iterator7, _step7, _step7$value, id, item;

    	        return regenerator.wrap(function _callee$(_context7) {
    	          while (1) {
    	            switch (_context7.prev = _context7.next) {
    	              case 0:
    	                _iterator7 = _createForOfIteratorHelper$1(pairs);
    	                _context7.prev = 1;

    	                _iterator7.s();

    	              case 3:
    	                if ((_step7 = _iterator7.n()).done) {
    	                  _context7.next = 10;
    	                  break;
    	                }

    	                _step7$value = slicedToArray(_step7.value, 2), id = _step7$value[0], item = _step7$value[1];

    	                if (!callback(item, id)) {
    	                  _context7.next = 8;
    	                  break;
    	                }

    	                _context7.next = 8;
    	                return [id, item];

    	              case 8:
    	                _context7.next = 3;
    	                break;

    	              case 10:
    	                _context7.next = 15;
    	                break;

    	              case 12:
    	                _context7.prev = 12;
    	                _context7.t0 = _context7["catch"](1);

    	                _iterator7.e(_context7.t0);

    	              case 15:
    	                _context7.prev = 15;

    	                _iterator7.f();

    	                return _context7.finish(15);

    	              case 18:
    	              case "end":
    	                return _context7.stop();
    	            }
    	          }
    	        }, _callee, null, [[1, 12, 15, 18]]);
    	      })));
    	    }
    	    /**
    	     * Execute a callback for each item of the stream.
    	     *
    	     * @param callback - The function that will be invoked for each item.
    	     */

    	  }, {
    	    key: "forEach",
    	    value: function forEach(callback) {
    	      var _iterator8 = _createForOfIteratorHelper$1(this._pairs),
    	          _step8;

    	      try {
    	        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
    	          var _step8$value = slicedToArray(_step8.value, 2),
    	              id = _step8$value[0],
    	              item = _step8$value[1];

    	          callback(item, id);
    	        }
    	      } catch (err) {
    	        _iterator8.e(err);
    	      } finally {
    	        _iterator8.f();
    	      }
    	    }
    	    /**
    	     * Map the items into a different type.
    	     *
    	     * @param callback - The function that does the conversion.
    	     *
    	     * @typeParam Mapped - The type of the item after mapping.
    	     *
    	     * @returns A new data stream with the mapped items.
    	     */

    	  }, {
    	    key: "map",
    	    value: function map(callback) {
    	      var pairs = this._pairs;
    	      return new DataStream(defineProperty$7({}, iterator$4, /*#__PURE__*/regenerator.mark(function _callee2() {
    	        var _iterator9, _step9, _step9$value, id, item;

    	        return regenerator.wrap(function _callee2$(_context8) {
    	          while (1) {
    	            switch (_context8.prev = _context8.next) {
    	              case 0:
    	                _iterator9 = _createForOfIteratorHelper$1(pairs);
    	                _context8.prev = 1;

    	                _iterator9.s();

    	              case 3:
    	                if ((_step9 = _iterator9.n()).done) {
    	                  _context8.next = 9;
    	                  break;
    	                }

    	                _step9$value = slicedToArray(_step9.value, 2), id = _step9$value[0], item = _step9$value[1];
    	                _context8.next = 7;
    	                return [id, callback(item, id)];

    	              case 7:
    	                _context8.next = 3;
    	                break;

    	              case 9:
    	                _context8.next = 14;
    	                break;

    	              case 11:
    	                _context8.prev = 11;
    	                _context8.t0 = _context8["catch"](1);

    	                _iterator9.e(_context8.t0);

    	              case 14:
    	                _context8.prev = 14;

    	                _iterator9.f();

    	                return _context8.finish(14);

    	              case 17:
    	              case "end":
    	                return _context8.stop();
    	            }
    	          }
    	        }, _callee2, null, [[1, 11, 14, 17]]);
    	      })));
    	    }
    	    /**
    	     * Get the item with the maximum value of given property.
    	     *
    	     * @param callback - The function that picks and possibly converts the property.
    	     *
    	     * @returns The item with the maximum if found otherwise null.
    	     */

    	  }, {
    	    key: "max",
    	    value: function max(callback) {
    	      var iter = getIterator$1(this._pairs);

    	      var curr = iter.next();

    	      if (curr.done) {
    	        return null;
    	      }

    	      var maxItem = curr.value[1];
    	      var maxValue = callback(curr.value[1], curr.value[0]);

    	      while (!(curr = iter.next()).done) {
    	        var _curr$value = slicedToArray(curr.value, 2),
    	            id = _curr$value[0],
    	            item = _curr$value[1];

    	        var _value = callback(item, id);

    	        if (_value > maxValue) {
    	          maxValue = _value;
    	          maxItem = item;
    	        }
    	      }

    	      return maxItem;
    	    }
    	    /**
    	     * Get the item with the minimum value of given property.
    	     *
    	     * @param callback - The function that picks and possibly converts the property.
    	     *
    	     * @returns The item with the minimum if found otherwise null.
    	     */

    	  }, {
    	    key: "min",
    	    value: function min(callback) {
    	      var iter = getIterator$1(this._pairs);

    	      var curr = iter.next();

    	      if (curr.done) {
    	        return null;
    	      }

    	      var minItem = curr.value[1];
    	      var minValue = callback(curr.value[1], curr.value[0]);

    	      while (!(curr = iter.next()).done) {
    	        var _curr$value2 = slicedToArray(curr.value, 2),
    	            id = _curr$value2[0],
    	            item = _curr$value2[1];

    	        var _value2 = callback(item, id);

    	        if (_value2 < minValue) {
    	          minValue = _value2;
    	          minItem = item;
    	        }
    	      }

    	      return minItem;
    	    }
    	    /**
    	     * Reduce the items into a single value.
    	     *
    	     * @param callback - The function that does the reduction.
    	     * @param accumulator - The initial value of the accumulator.
    	     *
    	     * @typeParam T - The type of the accumulated value.
    	     *
    	     * @returns The reduced value.
    	     */

    	  }, {
    	    key: "reduce",
    	    value: function reduce(callback, accumulator) {
    	      var _iterator10 = _createForOfIteratorHelper$1(this._pairs),
    	          _step10;

    	      try {
    	        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
    	          var _step10$value = slicedToArray(_step10.value, 2),
    	              id = _step10$value[0],
    	              item = _step10$value[1];

    	          accumulator = callback(accumulator, item, id);
    	        }
    	      } catch (err) {
    	        _iterator10.e(err);
    	      } finally {
    	        _iterator10.f();
    	      }

    	      return accumulator;
    	    }
    	    /**
    	     * Sort the items.
    	     *
    	     * @param callback - Item comparator.
    	     *
    	     * @returns A new stream with sorted items.
    	     */

    	  }, {
    	    key: "sort",
    	    value: function sort(callback) {
    	      var _this = this;

    	      return new DataStream(defineProperty$7({}, iterator$4, function () {
    	        var _context9;

    	        return getIterator$1(sort$2(_context9 = toConsumableArray(_this._pairs)).call(_context9, function (_ref, _ref2) {
    	          var _ref3 = slicedToArray(_ref, 2),
    	              idA = _ref3[0],
    	              itemA = _ref3[1];

    	          var _ref4 = slicedToArray(_ref2, 2),
    	              idB = _ref4[0],
    	              itemB = _ref4[1];

    	          return callback(itemA, itemB, idA, idB);
    	        }));
    	      }));
    	    }
    	  }]);

    	  return DataStream;
    	}();

    	function ownKeys$4(object, enumerableOnly) { var keys = keys$3(object); if (getOwnPropertySymbols$2) { var symbols = getOwnPropertySymbols$2(object); if (enumerableOnly) symbols = filter$2(symbols).call(symbols, function (sym) { return getOwnPropertyDescriptor$3(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context10; forEach$2(_context10 = ownKeys$4(Object(source), true)).call(_context10, function (key) { defineProperty$7(target, key, source[key]); }); } else if (getOwnPropertyDescriptors$2) { defineProperties$1(target, getOwnPropertyDescriptors$2(source)); } else { var _context11; forEach$2(_context11 = ownKeys$4(Object(source))).call(_context11, function (key) { defineProperty$4(target, key, getOwnPropertyDescriptor$3(source, key)); }); } } return target; }

    	function _createForOfIteratorHelper$2(o, allowArrayLike) { var it; if (typeof symbol$4 === "undefined" || getIteratorMethod$1(o) == null) { if (isArray$5(o) || (it = _unsupportedIterableToArray$3(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = getIterator$1(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

    	function _unsupportedIterableToArray$3(o, minLen) { var _context9; if (!o) return; if (typeof o === "string") return _arrayLikeToArray$3(o, minLen); var n = slice$5(_context9 = Object.prototype.toString.call(o)).call(_context9, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return from_1$2(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$3(o, minLen); }

    	function _arrayLikeToArray$3(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = getPrototypeOf$3(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = getPrototypeOf$3(this).constructor; result = construct$3(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return possibleConstructorReturn(this, result); }; }

    	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !construct$3) return false; if (construct$3.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(construct$3(Date, [], function () {})); return true; } catch (e) { return false; } }
    	/**
    	 * Add an id to given item if it doesn't have one already.
    	 *
    	 * @remarks
    	 * The item will be modified.
    	 *
    	 * @param item - The item that will have an id after a call to this function.
    	 * @param idProp - The key of the id property.
    	 *
    	 * @typeParam Item - Item type that may or may not have an id.
    	 * @typeParam IdProp - Name of the property that contains the id.
    	 *
    	 * @returns true
    	 */

    	function ensureFullItem(item, idProp) {
    	  if (item[idProp] == null) {
    	    // generate an id
    	    item[idProp] = v4();
    	  }

    	  return item;
    	}
    	/**
    	 * # DataSet
    	 *
    	 * Vis.js comes with a flexible DataSet, which can be used to hold and
    	 * manipulate unstructured data and listen for changes in the data. The DataSet
    	 * is key/value based. Data items can be added, updated and removed from the
    	 * DataSet, and one can subscribe to changes in the DataSet. The data in the
    	 * DataSet can be filtered and ordered. Data can be normalized when appending it
    	 * to the DataSet as well.
    	 *
    	 * ## Example
    	 *
    	 * The following example shows how to use a DataSet.
    	 *
    	 * ```javascript
    	 * // create a DataSet
    	 * var options = {};
    	 * var data = new vis.DataSet(options);
    	 *
    	 * // add items
    	 * // note that the data items can contain different properties and data formats
    	 * data.add([
    	 *   {id: 1, text: 'item 1', date: new Date(2013, 6, 20), group: 1, first: true},
    	 *   {id: 2, text: 'item 2', date: '2013-06-23', group: 2},
    	 *   {id: 3, text: 'item 3', date: '2013-06-25', group: 2},
    	 *   {id: 4, text: 'item 4'}
    	 * ]);
    	 *
    	 * // subscribe to any change in the DataSet
    	 * data.on('*', function (event, properties, senderId) {
    	 *   console.log('event', event, properties);
    	 * });
    	 *
    	 * // update an existing item
    	 * data.update({id: 2, group: 1});
    	 *
    	 * // remove an item
    	 * data.remove(4);
    	 *
    	 * // get all ids
    	 * var ids = data.getIds();
    	 * console.log('ids', ids);
    	 *
    	 * // get a specific item
    	 * var item1 = data.get(1);
    	 * console.log('item1', item1);
    	 *
    	 * // retrieve a filtered subset of the data
    	 * var items = data.get({
    	 *   filter: function (item) {
    	 *     return item.group == 1;
    	 *   }
    	 * });
    	 * console.log('filtered items', items);
    	 * ```
    	 *
    	 * @typeParam Item - Item type that may or may not have an id.
    	 * @typeParam IdProp - Name of the property that contains the id.
    	 */


    	var DataSet = /*#__PURE__*/function (_DataSetPart) {
    	  inherits(DataSet, _DataSetPart);

    	  var _super = _createSuper(DataSet);

    	  /**
    	   * Construct a new DataSet.
    	   *
    	   * @param data - Initial data or options.
    	   * @param options - Options (type error if data is also options).
    	   */
    	  function DataSet(data, options) {
    	    var _this;

    	    classCallCheck(this, DataSet);

    	    _this = _super.call(this);
    	    _this._queue = null; // correctly read optional arguments

    	    if (data && !isArray$5(data)) {
    	      options = data;
    	      data = [];
    	    }

    	    _this._options = options || {};
    	    _this._data = new map$5(); // map with data indexed by id

    	    _this.length = 0; // number of items in the DataSet

    	    _this._idProp = _this._options.fieldId || "id"; // name of the field containing id
    	    // add initial data when provided

    	    if (data && data.length) {
    	      _this.add(data);
    	    }

    	    _this.setOptions(options);

    	    return _this;
    	  }
    	  /** @inheritDoc */


    	  createClass(DataSet, [{
    	    key: "setOptions",

    	    /**
    	     * Set new options.
    	     *
    	     * @param options - The new options.
    	     */
    	    value: function setOptions(options) {
    	      if (options && options.queue !== undefined) {
    	        if (options.queue === false) {
    	          // delete queue if loaded
    	          if (this._queue) {
    	            this._queue.destroy();

    	            this._queue = null;
    	          }
    	        } else {
    	          // create queue and update its options
    	          if (!this._queue) {
    	            this._queue = Queue.extend(this, {
    	              replace: ["add", "update", "remove"]
    	            });
    	          }

    	          if (options.queue && _typeof_1(options.queue) === "object") {
    	            this._queue.setOptions(options.queue);
    	          }
    	        }
    	      }
    	    }
    	    /**
    	     * Add a data item or an array with items.
    	     *
    	     * After the items are added to the DataSet, the DataSet will trigger an event `add`. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
    	     *
    	     * ## Example
    	     *
    	     * ```javascript
    	     * // create a DataSet
    	     * const data = new vis.DataSet()
    	     *
    	     * // add items
    	     * const ids = data.add([
    	     *   { id: 1, text: 'item 1' },
    	     *   { id: 2, text: 'item 2' },
    	     *   { text: 'item without an id' }
    	     * ])
    	     *
    	     * console.log(ids) // [1, 2, '<UUIDv4>']
    	     * ```
    	     *
    	     * @param data - Items to be added (ids will be generated if missing).
    	     * @param senderId - Sender id.
    	     *
    	     * @returns addedIds - Array with the ids (generated if not present) of the added items.
    	     *
    	     * @throws When an item with the same id as any of the added items already exists.
    	     */

    	  }, {
    	    key: "add",
    	    value: function add(data, senderId) {
    	      var _this2 = this;

    	      var addedIds = [];
    	      var id;

    	      if (isArray$5(data)) {
    	        // Array
    	        var idsToAdd = map$2(data).call(data, function (d) {
    	          return d[_this2._idProp];
    	        });

    	        if (some$2(idsToAdd).call(idsToAdd, function (id) {
    	          return _this2._data.has(id);
    	        })) {
    	          throw new Error("A duplicate id was found in the parameter array.");
    	        }

    	        for (var i = 0, len = data.length; i < len; i++) {
    	          id = this._addItem(data[i]);
    	          addedIds.push(id);
    	        }
    	      } else if (data && _typeof_1(data) === "object") {
    	        // Single item
    	        id = this._addItem(data);
    	        addedIds.push(id);
    	      } else {
    	        throw new Error("Unknown dataType");
    	      }

    	      if (addedIds.length) {
    	        this._trigger("add", {
    	          items: addedIds
    	        }, senderId);
    	      }

    	      return addedIds;
    	    }
    	    /**
    	     * Update existing items. When an item does not exist, it will be created.
    	     *
    	     * @remarks
    	     * The provided properties will be merged in the existing item. When an item does not exist, it will be created.
    	     *
    	     * After the items are updated, the DataSet will trigger an event `add` for the added items, and an event `update`. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
    	     *
    	     * ## Example
    	     *
    	     * ```javascript
    	     * // create a DataSet
    	     * const data = new vis.DataSet([
    	     *   { id: 1, text: 'item 1' },
    	     *   { id: 2, text: 'item 2' },
    	     *   { id: 3, text: 'item 3' }
    	     * ])
    	     *
    	     * // update items
    	     * const ids = data.update([
    	     *   { id: 2, text: 'item 2 (updated)' },
    	     *   { id: 4, text: 'item 4 (new)' }
    	     * ])
    	     *
    	     * console.log(ids) // [2, 4]
    	     * ```
    	     *
    	     * ## Warning for TypeScript users
    	     * This method may introduce partial items into the data set. Use add or updateOnly instead for better type safety.
    	     *
    	     * @param data - Items to be updated (if the id is already present) or added (if the id is missing).
    	     * @param senderId - Sender id.
    	     *
    	     * @returns updatedIds - The ids of the added (these may be newly generated if there was no id in the item from the data) or updated items.
    	     *
    	     * @throws When the supplied data is neither an item nor an array of items.
    	     */

    	  }, {
    	    key: "update",
    	    value: function update(data, senderId) {
    	      var _this3 = this;

    	      var addedIds = [];
    	      var updatedIds = [];
    	      var oldData = [];
    	      var updatedData = [];
    	      var idProp = this._idProp;

    	      var addOrUpdate = function addOrUpdate(item) {
    	        var origId = item[idProp];

    	        if (origId != null && _this3._data.has(origId)) {
    	          var fullItem = item; // it has an id, therefore it is a fullitem

    	          var oldItem = assign$2({}, _this3._data.get(origId)); // update item


    	          var id = _this3._updateItem(fullItem);

    	          updatedIds.push(id);
    	          updatedData.push(fullItem);
    	          oldData.push(oldItem);
    	        } else {
    	          // add new item
    	          var _id = _this3._addItem(item);

    	          addedIds.push(_id);
    	        }
    	      };

    	      if (isArray$5(data)) {
    	        // Array
    	        for (var i = 0, len = data.length; i < len; i++) {
    	          if (data[i] && _typeof_1(data[i]) === "object") {
    	            addOrUpdate(data[i]);
    	          } else {
    	            console.warn("Ignoring input item, which is not an object at index " + i);
    	          }
    	        }
    	      } else if (data && _typeof_1(data) === "object") {
    	        // Single item
    	        addOrUpdate(data);
    	      } else {
    	        throw new Error("Unknown dataType");
    	      }

    	      if (addedIds.length) {
    	        this._trigger("add", {
    	          items: addedIds
    	        }, senderId);
    	      }

    	      if (updatedIds.length) {
    	        var props = {
    	          items: updatedIds,
    	          oldData: oldData,
    	          data: updatedData
    	        }; // TODO: remove deprecated property 'data' some day
    	        //Object.defineProperty(props, 'data', {
    	        //  'get': (function() {
    	        //    console.warn('Property data is deprecated. Use DataSet.get(ids) to retrieve the new data, use the oldData property on this object to get the old data');
    	        //    return updatedData;
    	        //  }).bind(this)
    	        //});

    	        this._trigger("update", props, senderId);
    	      }

    	      return concat$2(addedIds).call(addedIds, updatedIds);
    	    }
    	    /**
    	     * Update existing items. When an item does not exist, an error will be thrown.
    	     *
    	     * @remarks
    	     * The provided properties will be deeply merged into the existing item.
    	     * When an item does not exist (id not present in the data set or absent), an error will be thrown and nothing will be changed.
    	     *
    	     * After the items are updated, the DataSet will trigger an event `update`.
    	     * When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
    	     *
    	     * ## Example
    	     *
    	     * ```javascript
    	     * // create a DataSet
    	     * const data = new vis.DataSet([
    	     *   { id: 1, text: 'item 1' },
    	     *   { id: 2, text: 'item 2' },
    	     *   { id: 3, text: 'item 3' },
    	     * ])
    	     *
    	     * // update items
    	     * const ids = data.update([
    	     *   { id: 2, text: 'item 2 (updated)' }, // works
    	     *   // { id: 4, text: 'item 4 (new)' }, // would throw
    	     *   // { text: 'item 4 (new)' }, // would also throw
    	     * ])
    	     *
    	     * console.log(ids) // [2]
    	     * ```
    	     *
    	     * @param data - Updates (the id and optionally other props) to the items in this data set.
    	     * @param senderId - Sender id.
    	     *
    	     * @returns updatedIds - The ids of the updated items.
    	     *
    	     * @throws When the supplied data is neither an item nor an array of items, when the ids are missing.
    	     */

    	  }, {
    	    key: "updateOnly",
    	    value: function updateOnly(data, senderId) {
    	      var _context,
    	          _this4 = this;

    	      if (!isArray$5(data)) {
    	        data = [data];
    	      }

    	      var updateEventData = map$2(_context = map$2(data).call(data, function (update) {
    	        var oldData = _this4._data.get(update[_this4._idProp]);

    	        if (oldData == null) {
    	          throw new Error("Updating non-existent items is not allowed.");
    	        }

    	        return {
    	          oldData: oldData,
    	          update: update
    	        };
    	      })).call(_context, function (_ref) {
    	        var oldData = _ref.oldData,
    	            update = _ref.update;
    	        var id = oldData[_this4._idProp];
    	        var updatedData = pureDeepObjectAssign(oldData, update);

    	        _this4._data.set(id, updatedData);

    	        return {
    	          id: id,
    	          oldData: oldData,
    	          updatedData: updatedData
    	        };
    	      });

    	      if (updateEventData.length) {
    	        var props = {
    	          items: map$2(updateEventData).call(updateEventData, function (value) {
    	            return value.id;
    	          }),
    	          oldData: map$2(updateEventData).call(updateEventData, function (value) {
    	            return value.oldData;
    	          }),
    	          data: map$2(updateEventData).call(updateEventData, function (value) {
    	            return value.updatedData;
    	          })
    	        }; // TODO: remove deprecated property 'data' some day
    	        //Object.defineProperty(props, 'data', {
    	        //  'get': (function() {
    	        //    console.warn('Property data is deprecated. Use DataSet.get(ids) to retrieve the new data, use the oldData property on this object to get the old data');
    	        //    return updatedData;
    	        //  }).bind(this)
    	        //});

    	        this._trigger("update", props, senderId);

    	        return props.items;
    	      } else {
    	        return [];
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "get",
    	    value: function get(first, second) {
    	      // @TODO: Woudn't it be better to split this into multiple methods?
    	      // parse the arguments
    	      var id = undefined;
    	      var ids = undefined;
    	      var options = undefined;

    	      if (isId(first)) {
    	        // get(id [, options])
    	        id = first;
    	        options = second;
    	      } else if (isArray$5(first)) {
    	        // get(ids [, options])
    	        ids = first;
    	        options = second;
    	      } else {
    	        // get([, options])
    	        options = first;
    	      } // determine the return type


    	      var returnType = options && options.returnType === "Object" ? "Object" : "Array"; // @TODO: WTF is this? Or am I missing something?
    	      // var returnType
    	      // if (options && options.returnType) {
    	      //   var allowedValues = ['Array', 'Object']
    	      //   returnType =
    	      //     allowedValues.indexOf(options.returnType) == -1
    	      //       ? 'Array'
    	      //       : options.returnType
    	      // } else {
    	      //   returnType = 'Array'
    	      // }
    	      // build options

    	      var filter = options && filter$2(options);

    	      var items = [];
    	      var item = undefined;
    	      var itemIds = undefined;
    	      var itemId = undefined; // convert items

    	      if (id != null) {
    	        // return a single item
    	        item = this._data.get(id);

    	        if (item && filter && !filter(item)) {
    	          item = undefined;
    	        }
    	      } else if (ids != null) {
    	        // return a subset of items
    	        for (var i = 0, len = ids.length; i < len; i++) {
    	          item = this._data.get(ids[i]);

    	          if (item != null && (!filter || filter(item))) {
    	            items.push(item);
    	          }
    	        }
    	      } else {
    	        var _context2;

    	        // return all items
    	        itemIds = toConsumableArray(keys$6(_context2 = this._data).call(_context2));

    	        for (var _i = 0, _len = itemIds.length; _i < _len; _i++) {
    	          itemId = itemIds[_i];
    	          item = this._data.get(itemId);

    	          if (item != null && (!filter || filter(item))) {
    	            items.push(item);
    	          }
    	        }
    	      } // order the results


    	      if (options && options.order && id == undefined) {
    	        this._sort(items, options.order);
    	      } // filter fields of the items


    	      if (options && options.fields) {
    	        var fields = options.fields;

    	        if (id != undefined && item != null) {
    	          item = this._filterFields(item, fields);
    	        } else {
    	          for (var _i2 = 0, _len2 = items.length; _i2 < _len2; _i2++) {
    	            items[_i2] = this._filterFields(items[_i2], fields);
    	          }
    	        }
    	      } // return the results


    	      if (returnType == "Object") {
    	        var result = {};

    	        for (var _i3 = 0, _len3 = items.length; _i3 < _len3; _i3++) {
    	          var resultant = items[_i3]; // @TODO: Shoudn't this be this._fieldId?
    	          // result[resultant.id] = resultant

    	          var _id2 = resultant[this._idProp];
    	          result[_id2] = resultant;
    	        }

    	        return result;
    	      } else {
    	        if (id != null) {
    	          var _item;

    	          // a single item
    	          return (_item = item) !== null && _item !== void 0 ? _item : null;
    	        } else {
    	          // just return our array
    	          return items;
    	        }
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "getIds",
    	    value: function getIds(options) {
    	      var data = this._data;

    	      var filter = options && filter$2(options);

    	      var order = options && options.order;

    	      var itemIds = toConsumableArray(keys$6(data).call(data));

    	      var ids = [];

    	      if (filter) {
    	        // get filtered items
    	        if (order) {
    	          // create ordered list
    	          var items = [];

    	          for (var i = 0, len = itemIds.length; i < len; i++) {
    	            var id = itemIds[i];

    	            var item = this._data.get(id);

    	            if (item != null && filter(item)) {
    	              items.push(item);
    	            }
    	          }

    	          this._sort(items, order);

    	          for (var _i4 = 0, _len4 = items.length; _i4 < _len4; _i4++) {
    	            ids.push(items[_i4][this._idProp]);
    	          }
    	        } else {
    	          // create unordered list
    	          for (var _i5 = 0, _len5 = itemIds.length; _i5 < _len5; _i5++) {
    	            var _id3 = itemIds[_i5];

    	            var _item2 = this._data.get(_id3);

    	            if (_item2 != null && filter(_item2)) {
    	              ids.push(_item2[this._idProp]);
    	            }
    	          }
    	        }
    	      } else {
    	        // get all items
    	        if (order) {
    	          // create an ordered list
    	          var _items = [];

    	          for (var _i6 = 0, _len6 = itemIds.length; _i6 < _len6; _i6++) {
    	            var _id4 = itemIds[_i6];

    	            _items.push(data.get(_id4));
    	          }

    	          this._sort(_items, order);

    	          for (var _i7 = 0, _len7 = _items.length; _i7 < _len7; _i7++) {
    	            ids.push(_items[_i7][this._idProp]);
    	          }
    	        } else {
    	          // create unordered list
    	          for (var _i8 = 0, _len8 = itemIds.length; _i8 < _len8; _i8++) {
    	            var _id5 = itemIds[_i8];

    	            var _item3 = data.get(_id5);

    	            if (_item3 != null) {
    	              ids.push(_item3[this._idProp]);
    	            }
    	          }
    	        }
    	      }

    	      return ids;
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "getDataSet",
    	    value: function getDataSet() {
    	      return this;
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "forEach",
    	    value: function forEach(callback, options) {
    	      var filter = options && filter$2(options);

    	      var data = this._data;

    	      var itemIds = toConsumableArray(keys$6(data).call(data));

    	      if (options && options.order) {
    	        // execute forEach on ordered list
    	        var items = this.get(options);

    	        for (var i = 0, len = items.length; i < len; i++) {
    	          var item = items[i];
    	          var id = item[this._idProp];
    	          callback(item, id);
    	        }
    	      } else {
    	        // unordered
    	        for (var _i9 = 0, _len9 = itemIds.length; _i9 < _len9; _i9++) {
    	          var _id6 = itemIds[_i9];

    	          var _item4 = this._data.get(_id6);

    	          if (_item4 != null && (!filter || filter(_item4))) {
    	            callback(_item4, _id6);
    	          }
    	        }
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "map",
    	    value: function map(callback, options) {
    	      var filter = options && filter$2(options);

    	      var mappedItems = [];
    	      var data = this._data;

    	      var itemIds = toConsumableArray(keys$6(data).call(data)); // convert and filter items


    	      for (var i = 0, len = itemIds.length; i < len; i++) {
    	        var id = itemIds[i];

    	        var item = this._data.get(id);

    	        if (item != null && (!filter || filter(item))) {
    	          mappedItems.push(callback(item, id));
    	        }
    	      } // order items


    	      if (options && options.order) {
    	        this._sort(mappedItems, options.order);
    	      }

    	      return mappedItems;
    	    }
    	    /**
    	     * Filter the fields of an item.
    	     *
    	     * @param item - The item whose fields should be filtered.
    	     * @param fields - The names of the fields that will be kept.
    	     *
    	     * @typeParam K - Field name type.
    	     *
    	     * @returns The item without any additional fields.
    	     */

    	  }, {
    	    key: "_filterFields",
    	    value: function _filterFields(item, fields) {
    	      var _context3;

    	      if (!item) {
    	        // item is null
    	        return item;
    	      }

    	      return reduce$2(_context3 = isArray$5(fields) ? // Use the supplied array
    	      fields : // Use the keys of the supplied object
    	      keys$3(fields)).call(_context3, function (filteredItem, field) {
    	        filteredItem[field] = item[field];
    	        return filteredItem;
    	      }, {});
    	    }
    	    /**
    	     * Sort the provided array with items.
    	     *
    	     * @param items - Items to be sorted in place.
    	     * @param order - A field name or custom sort function.
    	     *
    	     * @typeParam T - The type of the items in the items array.
    	     */

    	  }, {
    	    key: "_sort",
    	    value: function _sort(items, order) {
    	      if (typeof order === "string") {
    	        // order by provided field name
    	        var name = order; // field name

    	        sort$2(items).call(items, function (a, b) {
    	          // @TODO: How to treat missing properties?
    	          var av = a[name];
    	          var bv = b[name];
    	          return av > bv ? 1 : av < bv ? -1 : 0;
    	        });
    	      } else if (typeof order === "function") {
    	        // order by sort function
    	        sort$2(items).call(items, order);
    	      } else {
    	        // TODO: extend order by an Object {field:string, direction:string}
    	        //       where direction can be 'asc' or 'desc'
    	        throw new TypeError("Order must be a function or a string");
    	      }
    	    }
    	    /**
    	     * Remove an item or multiple items by “reference” (only the id is used) or by id.
    	     *
    	     * The method ignores removal of non-existing items, and returns an array containing the ids of the items which are actually removed from the DataSet.
    	     *
    	     * After the items are removed, the DataSet will trigger an event `remove` for the removed items. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
    	     *
    	     * ## Example
    	     * ```javascript
    	     * // create a DataSet
    	     * const data = new vis.DataSet([
    	     *   { id: 1, text: 'item 1' },
    	     *   { id: 2, text: 'item 2' },
    	     *   { id: 3, text: 'item 3' }
    	     * ])
    	     *
    	     * // remove items
    	     * const ids = data.remove([2, { id: 3 }, 4])
    	     *
    	     * console.log(ids) // [2, 3]
    	     * ```
    	     *
    	     * @param id - One or more items or ids of items to be removed.
    	     * @param senderId - Sender id.
    	     *
    	     * @returns The ids of the removed items.
    	     */

    	  }, {
    	    key: "remove",
    	    value: function remove(id, senderId) {
    	      var removedIds = [];
    	      var removedItems = []; // force everything to be an array for simplicity

    	      var ids = isArray$5(id) ? id : [id];

    	      for (var i = 0, len = ids.length; i < len; i++) {
    	        var item = this._remove(ids[i]);

    	        if (item) {
    	          var itemId = item[this._idProp];

    	          if (itemId != null) {
    	            removedIds.push(itemId);
    	            removedItems.push(item);
    	          }
    	        }
    	      }

    	      if (removedIds.length) {
    	        this._trigger("remove", {
    	          items: removedIds,
    	          oldData: removedItems
    	        }, senderId);
    	      }

    	      return removedIds;
    	    }
    	    /**
    	     * Remove an item by its id or reference.
    	     *
    	     * @param id - Id of an item or the item itself.
    	     *
    	     * @returns The removed item if removed, null otherwise.
    	     */

    	  }, {
    	    key: "_remove",
    	    value: function _remove(id) {
    	      // @TODO: It origianlly returned the item although the docs say id.
    	      // The code expects the item, so probably an error in the docs.
    	      var ident; // confirm the id to use based on the args type

    	      if (isId(id)) {
    	        ident = id;
    	      } else if (id && _typeof_1(id) === "object") {
    	        ident = id[this._idProp]; // look for the identifier field using ._idProp
    	      } // do the removing if the item is found


    	      if (ident != null && this._data.has(ident)) {
    	        var item = this._data.get(ident) || null;

    	        this._data.delete(ident);

    	        --this.length;
    	        return item;
    	      }

    	      return null;
    	    }
    	    /**
    	     * Clear the entire data set.
    	     *
    	     * After the items are removed, the [[DataSet]] will trigger an event `remove` for all removed items. When a `senderId` is provided, this id will be passed with the triggered event to all subscribers.
    	     *
    	     * @param senderId - Sender id.
    	     *
    	     * @returns removedIds - The ids of all removed items.
    	     */

    	  }, {
    	    key: "clear",
    	    value: function clear(senderId) {
    	      var _context4;

    	      var ids = toConsumableArray(keys$6(_context4 = this._data).call(_context4));

    	      var items = [];

    	      for (var i = 0, len = ids.length; i < len; i++) {
    	        items.push(this._data.get(ids[i]));
    	      }

    	      this._data.clear();

    	      this.length = 0;

    	      this._trigger("remove", {
    	        items: ids,
    	        oldData: items
    	      }, senderId);

    	      return ids;
    	    }
    	    /**
    	     * Find the item with maximum value of a specified field.
    	     *
    	     * @param field - Name of the property that should be searched for max value.
    	     *
    	     * @returns Item containing max value, or null if no items.
    	     */

    	  }, {
    	    key: "max",
    	    value: function max(field) {
    	      var _context5;

    	      var max = null;
    	      var maxField = null;

    	      var _iterator = _createForOfIteratorHelper$2(values$3(_context5 = this._data).call(_context5)),
    	          _step;

    	      try {
    	        for (_iterator.s(); !(_step = _iterator.n()).done;) {
    	          var item = _step.value;
    	          var itemField = item[field];

    	          if (typeof itemField === "number" && (maxField == null || itemField > maxField)) {
    	            max = item;
    	            maxField = itemField;
    	          }
    	        }
    	      } catch (err) {
    	        _iterator.e(err);
    	      } finally {
    	        _iterator.f();
    	      }

    	      return max || null;
    	    }
    	    /**
    	     * Find the item with minimum value of a specified field.
    	     *
    	     * @param field - Name of the property that should be searched for min value.
    	     *
    	     * @returns Item containing min value, or null if no items.
    	     */

    	  }, {
    	    key: "min",
    	    value: function min(field) {
    	      var _context6;

    	      var min = null;
    	      var minField = null;

    	      var _iterator2 = _createForOfIteratorHelper$2(values$3(_context6 = this._data).call(_context6)),
    	          _step2;

    	      try {
    	        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
    	          var item = _step2.value;
    	          var itemField = item[field];

    	          if (typeof itemField === "number" && (minField == null || itemField < minField)) {
    	            min = item;
    	            minField = itemField;
    	          }
    	        }
    	      } catch (err) {
    	        _iterator2.e(err);
    	      } finally {
    	        _iterator2.f();
    	      }

    	      return min || null;
    	    }
    	    /**
    	     * Find all distinct values of a specified field
    	     *
    	     * @param prop - The property name whose distinct values should be returned.
    	     *
    	     * @returns Unordered array containing all distinct values. Items without specified property are ignored.
    	     */

    	  }, {
    	    key: "distinct",
    	    value: function distinct(prop) {
    	      var data = this._data;

    	      var itemIds = toConsumableArray(keys$6(data).call(data));

    	      var values = [];
    	      var count = 0;

    	      for (var i = 0, len = itemIds.length; i < len; i++) {
    	        var id = itemIds[i];
    	        var item = data.get(id);
    	        var value = item[prop];
    	        var exists = false;

    	        for (var j = 0; j < count; j++) {
    	          if (values[j] == value) {
    	            exists = true;
    	            break;
    	          }
    	        }

    	        if (!exists && value !== undefined) {
    	          values[count] = value;
    	          count++;
    	        }
    	      }

    	      return values;
    	    }
    	    /**
    	     * Add a single item. Will fail when an item with the same id already exists.
    	     *
    	     * @param item - A new item to be added.
    	     *
    	     * @returns Added item's id. An id is generated when it is not present in the item.
    	     */

    	  }, {
    	    key: "_addItem",
    	    value: function _addItem(item) {
    	      var fullItem = ensureFullItem(item, this._idProp);
    	      var id = fullItem[this._idProp]; // check whether this id is already taken

    	      if (this._data.has(id)) {
    	        // item already exists
    	        throw new Error("Cannot add item: item with id " + id + " already exists");
    	      }

    	      this._data.set(id, fullItem);

    	      ++this.length;
    	      return id;
    	    }
    	    /**
    	     * Update a single item: merge with existing item.
    	     * Will fail when the item has no id, or when there does not exist an item with the same id.
    	     *
    	     * @param update - The new item
    	     *
    	     * @returns The id of the updated item.
    	     */

    	  }, {
    	    key: "_updateItem",
    	    value: function _updateItem(update) {
    	      var id = update[this._idProp];

    	      if (id == null) {
    	        throw new Error("Cannot update item: item has no id (item: " + stringify$2(update) + ")");
    	      }

    	      var item = this._data.get(id);

    	      if (!item) {
    	        // item doesn't exist
    	        throw new Error("Cannot update item: no item with id " + id + " found");
    	      }

    	      this._data.set(id, _objectSpread(_objectSpread({}, item), update));

    	      return id;
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "stream",
    	    value: function stream(ids) {
    	      if (ids) {
    	        var data = this._data;
    	        return new DataStream(defineProperty$7({}, iterator$4, /*#__PURE__*/regenerator.mark(function _callee() {
    	          var _iterator3, _step3, id, item;

    	          return regenerator.wrap(function _callee$(_context7) {
    	            while (1) {
    	              switch (_context7.prev = _context7.next) {
    	                case 0:
    	                  _iterator3 = _createForOfIteratorHelper$2(ids);
    	                  _context7.prev = 1;

    	                  _iterator3.s();

    	                case 3:
    	                  if ((_step3 = _iterator3.n()).done) {
    	                    _context7.next = 11;
    	                    break;
    	                  }

    	                  id = _step3.value;
    	                  item = data.get(id);

    	                  if (!(item != null)) {
    	                    _context7.next = 9;
    	                    break;
    	                  }

    	                  _context7.next = 9;
    	                  return [id, item];

    	                case 9:
    	                  _context7.next = 3;
    	                  break;

    	                case 11:
    	                  _context7.next = 16;
    	                  break;

    	                case 13:
    	                  _context7.prev = 13;
    	                  _context7.t0 = _context7["catch"](1);

    	                  _iterator3.e(_context7.t0);

    	                case 16:
    	                  _context7.prev = 16;

    	                  _iterator3.f();

    	                  return _context7.finish(16);

    	                case 19:
    	                case "end":
    	                  return _context7.stop();
    	              }
    	            }
    	          }, _callee, null, [[1, 13, 16, 19]]);
    	        })));
    	      } else {
    	        var _context8;

    	        return new DataStream(defineProperty$7({}, iterator$4, bind$2(_context8 = entries$2(this._data)).call(_context8, this._data)));
    	      }
    	    }
    	  }, {
    	    key: "idProp",
    	    get: function get() {
    	      return this._idProp;
    	    }
    	  }]);

    	  return DataSet;
    	}(DataSetPart);

    	function _createForOfIteratorHelper$3(o, allowArrayLike) { var it; if (typeof symbol$4 === "undefined" || getIteratorMethod$1(o) == null) { if (isArray$5(o) || (it = _unsupportedIterableToArray$4(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = getIterator$1(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

    	function _unsupportedIterableToArray$4(o, minLen) { var _context5; if (!o) return; if (typeof o === "string") return _arrayLikeToArray$4(o, minLen); var n = slice$5(_context5 = Object.prototype.toString.call(o)).call(_context5, 8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return from_1$2(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$4(o, minLen); }

    	function _arrayLikeToArray$4(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    	function _createSuper$1(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$1(); return function _createSuperInternal() { var Super = getPrototypeOf$3(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = getPrototypeOf$3(this).constructor; result = construct$3(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return possibleConstructorReturn(this, result); }; }

    	function _isNativeReflectConstruct$1() { if (typeof Reflect === "undefined" || !construct$3) return false; if (construct$3.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(construct$3(Date, [], function () {})); return true; } catch (e) { return false; } }
    	/**
    	 * DataView
    	 *
    	 * A DataView offers a filtered and/or formatted view on a DataSet. One can subscribe to changes in a DataView, and easily get filtered or formatted data without having to specify filters and field types all the time.
    	 *
    	 * ## Example
    	 * ```javascript
    	 * // create a DataSet
    	 * var data = new vis.DataSet();
    	 * data.add([
    	 *   {id: 1, text: 'item 1', date: new Date(2013, 6, 20), group: 1, first: true},
    	 *   {id: 2, text: 'item 2', date: '2013-06-23', group: 2},
    	 *   {id: 3, text: 'item 3', date: '2013-06-25', group: 2},
    	 *   {id: 4, text: 'item 4'}
    	 * ]);
    	 *
    	 * // create a DataView
    	 * // the view will only contain items having a property group with value 1,
    	 * // and will only output fields id, text, and date.
    	 * var view = new vis.DataView(data, {
    	 *   filter: function (item) {
    	 *     return (item.group == 1);
    	 *   },
    	 *   fields: ['id', 'text', 'date']
    	 * });
    	 *
    	 * // subscribe to any change in the DataView
    	 * view.on('*', function (event, properties, senderId) {
    	 *   console.log('event', event, properties);
    	 * });
    	 *
    	 * // update an item in the data set
    	 * data.update({id: 2, group: 1});
    	 *
    	 * // get all ids in the view
    	 * var ids = view.getIds();
    	 * console.log('ids', ids); // will output [1, 2]
    	 *
    	 * // get all items in the view
    	 * var items = view.get();
    	 * ```
    	 *
    	 * @typeParam Item - Item type that may or may not have an id.
    	 * @typeParam IdProp - Name of the property that contains the id.
    	 */

    	var DataView = /*#__PURE__*/function (_DataSetPart) {
    	  inherits(DataView, _DataSetPart);

    	  var _super = _createSuper$1(DataView);

    	  /**
    	   * Create a DataView.
    	   *
    	   * @param data - The instance containing data (directly or indirectly).
    	   * @param options - Options to configure this data view.
    	   */
    	  function DataView(data, options) {
    	    var _context;

    	    var _this;

    	    classCallCheck(this, DataView);

    	    _this = _super.call(this);
    	    /** @inheritDoc */

    	    _this.length = 0;
    	    _this._ids = new set$3(); // ids of the items currently in memory (just contains a boolean true)

    	    _this._options = options || {};
    	    _this._listener = bind$2(_context = _this._onEvent).call(_context, assertThisInitialized(_this));

    	    _this.setData(data);

    	    return _this;
    	  }
    	  /** @inheritDoc */


    	  createClass(DataView, [{
    	    key: "setData",
    	    // TODO: implement a function .config() to dynamically update things like configured filter
    	    // and trigger changes accordingly

    	    /**
    	     * Set a data source for the view.
    	     *
    	     * @param data - The instance containing data (directly or indirectly).
    	     *
    	     * @remarks
    	     * Note that when the data view is bound to a data set it won't be garbage
    	     * collected unless the data set is too. Use `dataView.setData(null)` or
    	     * `dataView.dispose()` to enable garbage collection before you lose the last
    	     * reference.
    	     */
    	    value: function setData(data) {
    	      if (this._data) {
    	        // unsubscribe from current dataset
    	        if (this._data.off) {
    	          this._data.off("*", this._listener);
    	        } // trigger a remove of all items in memory


    	        var ids = this._data.getIds({
    	          filter: filter$2(this._options)
    	        });

    	        var items = this._data.get(ids);

    	        this._ids.clear();

    	        this.length = 0;

    	        this._trigger("remove", {
    	          items: ids,
    	          oldData: items
    	        });
    	      }

    	      if (data != null) {
    	        this._data = data; // trigger an add of all added items

    	        var _ids = this._data.getIds({
    	          filter: filter$2(this._options)
    	        });

    	        for (var i = 0, len = _ids.length; i < len; i++) {
    	          var id = _ids[i];

    	          this._ids.add(id);
    	        }

    	        this.length = _ids.length;

    	        this._trigger("add", {
    	          items: _ids
    	        });
    	      } else {
    	        this._data = new DataSet();
    	      } // subscribe to new dataset


    	      if (this._data.on) {
    	        this._data.on("*", this._listener);
    	      }
    	    }
    	    /**
    	     * Refresh the DataView.
    	     * Useful when the DataView has a filter function containing a variable parameter.
    	     */

    	  }, {
    	    key: "refresh",
    	    value: function refresh() {
    	      var ids = this._data.getIds({
    	        filter: filter$2(this._options)
    	      });

    	      var oldIds = toConsumableArray(this._ids);

    	      var newIds = {};
    	      var addedIds = [];
    	      var removedIds = [];
    	      var removedItems = []; // check for additions

    	      for (var i = 0, len = ids.length; i < len; i++) {
    	        var id = ids[i];
    	        newIds[id] = true;

    	        if (!this._ids.has(id)) {
    	          addedIds.push(id);

    	          this._ids.add(id);
    	        }
    	      } // check for removals


    	      for (var _i = 0, _len = oldIds.length; _i < _len; _i++) {
    	        var _id = oldIds[_i];

    	        var item = this._data.get(_id);

    	        if (item == null) {
    	          // @TODO: Investigate.
    	          // Doesn't happen during tests or examples.
    	          // Is it really impossible or could it eventually happen?
    	          // How to handle it if it does? The types guarantee non-nullable items.
    	          console.error("If you see this, report it please.");
    	        } else if (!newIds[_id]) {
    	          removedIds.push(_id);
    	          removedItems.push(item);

    	          this._ids.delete(_id);
    	        }
    	      }

    	      this.length += addedIds.length - removedIds.length; // trigger events

    	      if (addedIds.length) {
    	        this._trigger("add", {
    	          items: addedIds
    	        });
    	      }

    	      if (removedIds.length) {
    	        this._trigger("remove", {
    	          items: removedIds,
    	          oldData: removedItems
    	        });
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "get",
    	    value: function get(first, second) {
    	      if (this._data == null) {
    	        return null;
    	      } // parse the arguments


    	      var ids = null;
    	      var options;

    	      if (isId(first) || isArray$5(first)) {
    	        ids = first;
    	        options = second;
    	      } else {
    	        options = first;
    	      } // extend the options with the default options and provided options


    	      var viewOptions = assign$2({}, this._options, options); // create a combined filter method when needed


    	      var thisFilter = filter$2(this._options);

    	      var optionsFilter = options && filter$2(options);

    	      if (thisFilter && optionsFilter) {
    	        viewOptions.filter = function (item) {
    	          return thisFilter(item) && optionsFilter(item);
    	        };
    	      }

    	      if (ids == null) {
    	        return this._data.get(viewOptions);
    	      } else {
    	        return this._data.get(ids, viewOptions);
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "getIds",
    	    value: function getIds(options) {
    	      if (this._data.length) {
    	        var defaultFilter = filter$2(this._options);

    	        var optionsFilter = options != null ? filter$2(options) : null;
    	        var filter;

    	        if (optionsFilter) {
    	          if (defaultFilter) {
    	            filter = function filter(item) {
    	              return defaultFilter(item) && optionsFilter(item);
    	            };
    	          } else {
    	            filter = optionsFilter;
    	          }
    	        } else {
    	          filter = defaultFilter;
    	        }

    	        return this._data.getIds({
    	          filter: filter,
    	          order: options && options.order
    	        });
    	      } else {
    	        return [];
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "forEach",
    	    value: function forEach(callback, options) {
    	      if (this._data) {
    	        var _context2;

    	        var defaultFilter = filter$2(this._options);

    	        var optionsFilter = options && filter$2(options);

    	        var filter;

    	        if (optionsFilter) {
    	          if (defaultFilter) {
    	            filter = function filter(item) {
    	              return defaultFilter(item) && optionsFilter(item);
    	            };
    	          } else {
    	            filter = optionsFilter;
    	          }
    	        } else {
    	          filter = defaultFilter;
    	        }

    	        forEach$2(_context2 = this._data).call(_context2, callback, {
    	          filter: filter,
    	          order: options && options.order
    	        });
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "map",
    	    value: function map(callback, options) {
    	      if (this._data) {
    	        var _context3;

    	        var defaultFilter = filter$2(this._options);

    	        var optionsFilter = options && filter$2(options);

    	        var filter;

    	        if (optionsFilter) {
    	          if (defaultFilter) {
    	            filter = function filter(item) {
    	              return defaultFilter(item) && optionsFilter(item);
    	            };
    	          } else {
    	            filter = optionsFilter;
    	          }
    	        } else {
    	          filter = defaultFilter;
    	        }

    	        return map$2(_context3 = this._data).call(_context3, callback, {
    	          filter: filter,
    	          order: options && options.order
    	        });
    	      } else {
    	        return [];
    	      }
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "getDataSet",
    	    value: function getDataSet() {
    	      return this._data.getDataSet();
    	    }
    	    /** @inheritDoc */

    	  }, {
    	    key: "stream",
    	    value: function stream(ids) {
    	      var _context4;

    	      return this._data.stream(ids || defineProperty$7({}, iterator$4, bind$2(_context4 = keys$6(this._ids)).call(_context4, this._ids)));
    	    }
    	    /**
    	     * Render the instance unusable prior to garbage collection.
    	     *
    	     * @remarks
    	     * The intention of this method is to help discover scenarios where the data
    	     * view is being used when the programmer thinks it has been garbage collected
    	     * already. It's stricter version of `dataView.setData(null)`.
    	     */

    	  }, {
    	    key: "dispose",
    	    value: function dispose() {
    	      var _this$_data;

    	      if ((_this$_data = this._data) === null || _this$_data === void 0 ? void 0 : _this$_data.off) {
    	        this._data.off("*", this._listener);
    	      }

    	      var message = "This data view has already been disposed of.";
    	      var replacement = {
    	        get: function get() {
    	          throw new Error(message);
    	        },
    	        set: function set() {
    	          throw new Error(message);
    	        },
    	        configurable: false
    	      };

    	      var _iterator = _createForOfIteratorHelper$3(ownKeys$3(DataView.prototype)),
    	          _step;

    	      try {
    	        for (_iterator.s(); !(_step = _iterator.n()).done;) {
    	          var key = _step.value;

    	          defineProperty$4(this, key, replacement);
    	        }
    	      } catch (err) {
    	        _iterator.e(err);
    	      } finally {
    	        _iterator.f();
    	      }
    	    }
    	    /**
    	     * Event listener. Will propagate all events from the connected data set to the subscribers of the DataView, but will filter the items and only trigger when there are changes in the filtered data set.
    	     *
    	     * @param event - The name of the event.
    	     * @param params - Parameters of the event.
    	     * @param senderId - Id supplied by the sender.
    	     */

    	  }, {
    	    key: "_onEvent",
    	    value: function _onEvent(event, params, senderId) {
    	      if (!params || !params.items || !this._data) {
    	        return;
    	      }

    	      var ids = params.items;
    	      var addedIds = [];
    	      var updatedIds = [];
    	      var removedIds = [];
    	      var oldItems = [];
    	      var updatedItems = [];
    	      var removedItems = [];

    	      switch (event) {
    	        case "add":
    	          // filter the ids of the added items
    	          for (var i = 0, len = ids.length; i < len; i++) {
    	            var id = ids[i];
    	            var item = this.get(id);

    	            if (item) {
    	              this._ids.add(id);

    	              addedIds.push(id);
    	            }
    	          }

    	          break;

    	        case "update":
    	          // determine the event from the views viewpoint: an updated
    	          // item can be added, updated, or removed from this view.
    	          for (var _i2 = 0, _len2 = ids.length; _i2 < _len2; _i2++) {
    	            var _id2 = ids[_i2];

    	            var _item = this.get(_id2);

    	            if (_item) {
    	              if (this._ids.has(_id2)) {
    	                updatedIds.push(_id2);
    	                updatedItems.push(params.data[_i2]);
    	                oldItems.push(params.oldData[_i2]);
    	              } else {
    	                this._ids.add(_id2);

    	                addedIds.push(_id2);
    	              }
    	            } else {
    	              if (this._ids.has(_id2)) {
    	                this._ids.delete(_id2);

    	                removedIds.push(_id2);
    	                removedItems.push(params.oldData[_i2]);
    	              }
    	            }
    	          }

    	          break;

    	        case "remove":
    	          // filter the ids of the removed items
    	          for (var _i3 = 0, _len3 = ids.length; _i3 < _len3; _i3++) {
    	            var _id3 = ids[_i3];

    	            if (this._ids.has(_id3)) {
    	              this._ids.delete(_id3);

    	              removedIds.push(_id3);
    	              removedItems.push(params.oldData[_i3]);
    	            }
    	          }

    	          break;
    	      }

    	      this.length += addedIds.length - removedIds.length;

    	      if (addedIds.length) {
    	        this._trigger("add", {
    	          items: addedIds
    	        }, senderId);
    	      }

    	      if (updatedIds.length) {
    	        this._trigger("update", {
    	          items: updatedIds,
    	          oldData: oldItems,
    	          data: updatedItems
    	        }, senderId);
    	      }

    	      if (removedIds.length) {
    	        this._trigger("remove", {
    	          items: removedIds,
    	          oldData: removedItems
    	        }, senderId);
    	      }
    	    }
    	  }, {
    	    key: "idProp",
    	    get: function get() {
    	      return this.getDataSet().idProp;
    	    }
    	  }]);

    	  return DataView;
    	}(DataSetPart);

    	/**
    	 * Check that given value is compatible with Vis Data Set interface.
    	 *
    	 * @param idProp - The expected property to contain item id.
    	 * @param v - The value to be tested.
    	 *
    	 * @returns True if all expected values and methods match, false otherwise.
    	 */
    	function isDataSetLike(idProp, v) {
    	  return _typeof_1(v) === "object" && v !== null && idProp === v.idProp && typeof v.add === "function" && typeof v.clear === "function" && typeof v.distinct === "function" && typeof forEach$2(v) === "function" && typeof v.get === "function" && typeof v.getDataSet === "function" && typeof v.getIds === "function" && typeof v.length === "number" && typeof map$2(v) === "function" && typeof v.max === "function" && typeof v.min === "function" && typeof v.off === "function" && typeof v.on === "function" && typeof v.remove === "function" && typeof v.setOptions === "function" && typeof v.stream === "function" && typeof v.update === "function" && typeof v.updateOnly === "function";
    	}

    	/**
    	 * Check that given value is compatible with Vis Data View interface.
    	 *
    	 * @param idProp - The expected property to contain item id.
    	 * @param v - The value to be tested.
    	 *
    	 * @returns True if all expected values and methods match, false otherwise.
    	 */

    	function isDataViewLike(idProp, v) {
    	  return _typeof_1(v) === "object" && v !== null && idProp === v.idProp && typeof forEach$2(v) === "function" && typeof v.get === "function" && typeof v.getDataSet === "function" && typeof v.getIds === "function" && typeof v.length === "number" && typeof map$2(v) === "function" && typeof v.off === "function" && typeof v.on === "function" && typeof v.stream === "function" && isDataSetLike(idProp, v.getDataSet());
    	}

    	exports.DELETE = DELETE;
    	exports.DataSet = DataSet;
    	exports.DataStream = DataStream;
    	exports.DataView = DataView;
    	exports.Queue = Queue;
    	exports.createNewDataPipeFrom = createNewDataPipeFrom;
    	exports.isDataSetLike = isDataSetLike;
    	exports.isDataViewLike = isDataViewLike;

    	Object.defineProperty(exports, '__esModule', { value: true });

    })));

    });

    var visNetwork_min = createCommonjsModule(function (module, exports) {
    /**
     * vis-network
     * https://visjs.github.io/vis-network/
     *
     * A dynamic, browser-based visualization library.
     *
     * @version 8.5.4
     * @date    2020-11-23T19:50:32.883Z
     *
     * @copyright (c) 2011-2017 Almende B.V, http://almende.com
     * @copyright (c) 2017-2019 visjs contributors, https://github.com/visjs
     *
     * @license
     * vis.js is dual licensed under both
     *
     *   1. The Apache 2.0 License
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     *   and
     *
     *   2. The MIT License
     *      http://opensource.org/licenses/MIT
     *
     * vis.js may be distributed under either license.
     */
    !function(t,e){e(exports,visData);}(commonjsGlobal,(function(t,e){var i="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof commonjsGlobal?commonjsGlobal:"undefined"!=typeof self?self:{};function o(t,e,i){return t(i={path:e,exports:{},require:function(t,e){return function(){throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs")}(null==e&&i.path)}},i.exports),i.exports}var n=function(t){return t&&t.Math==Math&&t},r=n("object"==typeof globalThis&&globalThis)||n("object"==typeof window&&window)||n("object"==typeof self&&self)||n("object"==typeof i&&i)||function(){return this}()||Function("return this")(),s=function(t){try{return !!t()}catch(t){return !0}},a=!s((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]})),h={}.propertyIsEnumerable,d=Object.getOwnPropertyDescriptor,l={f:d&&!h.call({1:2},1)?function(t){var e=d(this,t);return !!e&&e.enumerable}:h},c=function(t,e){return {enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}},u={}.toString,f=function(t){return u.call(t).slice(8,-1)},p="".split,v=s((function(){return !Object("z").propertyIsEnumerable(0)}))?function(t){return "String"==f(t)?p.call(t,""):Object(t)}:Object,g=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t},y=function(t){return v(g(t))},m=function(t){return "object"==typeof t?null!==t:"function"==typeof t},b=function(t,e){if(!m(t))return t;var i,o;if(e&&"function"==typeof(i=t.toString)&&!m(o=i.call(t)))return o;if("function"==typeof(i=t.valueOf)&&!m(o=i.call(t)))return o;if(!e&&"function"==typeof(i=t.toString)&&!m(o=i.call(t)))return o;throw TypeError("Can't convert object to primitive value")},w={}.hasOwnProperty,k=function(t,e){return w.call(t,e)},_=r.document,x=m(_)&&m(_.createElement),E=function(t){return x?_.createElement(t):{}},O=!a&&!s((function(){return 7!=Object.defineProperty(E("div"),"a",{get:function(){return 7}}).a})),C=Object.getOwnPropertyDescriptor,S={f:a?C:function(t,e){if(t=y(t),e=b(e,!0),O)try{return C(t,e)}catch(t){}if(k(t,e))return c(!l.f.call(t,e),t[e])}},T=/#|\.prototype\./,M=function(t,e){var i=P[D(t)];return i==z||i!=I&&("function"==typeof e?s(e):!!e)},D=M.normalize=function(t){return String(t).replace(T,".").toLowerCase()},P=M.data={},I=M.NATIVE="N",z=M.POLYFILL="P",B=M,F={},N=function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function");return t},A=function(t,e,i){if(N(t),void 0===e)return t;switch(i){case 0:return function(){return t.call(e)};case 1:return function(i){return t.call(e,i)};case 2:return function(i,o){return t.call(e,i,o)};case 3:return function(i,o,n){return t.call(e,i,o,n)}}return function(){return t.apply(e,arguments)}},R=function(t){if(!m(t))throw TypeError(String(t)+" is not an object");return t},j=Object.defineProperty,L={f:a?j:function(t,e,i){if(R(t),e=b(e,!0),R(i),O)try{return j(t,e,i)}catch(t){}if("get"in i||"set"in i)throw TypeError("Accessors not supported");return "value"in i&&(t[e]=i.value),t}},H=a?function(t,e,i){return L.f(t,e,c(1,i))}:function(t,e,i){return t[e]=i,t},W=S.f,V=function(t){var e=function(e,i,o){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,i)}return new t(e,i,o)}return t.apply(this,arguments)};return e.prototype=t.prototype,e},q=function(t,e){var i,o,n,s,a,h,d,l,c=t.target,u=t.global,f=t.stat,p=t.proto,v=u?r:f?r[c]:(r[c]||{}).prototype,g=u?F:F[c]||(F[c]={}),y=g.prototype;for(n in e)i=!B(u?n:c+(f?".":"#")+n,t.forced)&&v&&k(v,n),a=g[n],i&&(h=t.noTargetGet?(l=W(v,n))&&l.value:v[n]),s=i&&h?h:e[n],i&&typeof a==typeof s||(d=t.bind&&i?A(s,r):t.wrap&&i?V(s):p&&"function"==typeof s?A(Function.call,s):s,(t.sham||s&&s.sham||a&&a.sham)&&H(d,"sham",!0),g[n]=d,p&&(k(F,o=c+"Prototype")||H(F,o,{}),F[o][n]=s,t.real&&y&&!y[n]&&H(y,n,s)));},U=[].slice,Y={},X=function(t,e,i){if(!(e in Y)){for(var o=[],n=0;n<e;n++)o[n]="a["+n+"]";Y[e]=Function("C,a","return new C("+o.join(",")+")");}return Y[e](t,i)},G=Function.bind||function(t){var e=N(this),i=U.call(arguments,1),o=function(){var n=i.concat(U.call(arguments));return this instanceof o?X(e,n.length,n):e.apply(t,n)};return m(e.prototype)&&(o.prototype=e.prototype),o};q({target:"Function",proto:!0},{bind:G});var K=function(t){return F[t+"Prototype"]},$=K("Function").bind,Z=Function.prototype,Q=function(t){var e=t.bind;return t===Z||t instanceof Function&&e===Z.bind?$:e},J=Math.ceil,tt=Math.floor,et=function(t){return isNaN(t=+t)?0:(t>0?tt:J)(t)},it=Math.min,ot=function(t){return t>0?it(et(t),9007199254740991):0},nt=Math.max,rt=Math.min,st=function(t,e){var i=et(t);return i<0?nt(i+e,0):rt(i,e)},at=function(t){return function(e,i,o){var n,r=y(e),s=ot(r.length),a=st(o,s);if(t&&i!=i){for(;s>a;)if((n=r[a++])!=n)return !0}else for(;s>a;a++)if((t||a in r)&&r[a]===i)return t||a||0;return !t&&-1}},ht={includes:at(!0),indexOf:at(!1)},dt={},lt=ht.indexOf,ct=function(t,e){var i,o=y(t),n=0,r=[];for(i in o)!k(dt,i)&&k(o,i)&&r.push(i);for(;e.length>n;)k(o,i=e[n++])&&(~lt(r,i)||r.push(i));return r},ut=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],ft=Object.keys||function(t){return ct(t,ut)},pt={f:Object.getOwnPropertySymbols},vt=function(t){return Object(g(t))},gt=Object.assign,yt=Object.defineProperty,mt=!gt||s((function(){if(a&&1!==gt({b:1},gt(yt({},"a",{enumerable:!0,get:function(){yt(this,"b",{value:3,enumerable:!1});}}),{b:2})).b)return !0;var t={},e={},i=Symbol(),o="abcdefghijklmnopqrst";return t[i]=7,o.split("").forEach((function(t){e[t]=t;})),7!=gt({},t)[i]||ft(gt({},e)).join("")!=o}))?function(t,e){for(var i=vt(t),o=arguments.length,n=1,r=pt.f,s=l.f;o>n;)for(var h,d=v(arguments[n++]),c=r?ft(d).concat(r(d)):ft(d),u=c.length,f=0;u>f;)h=c[f++],a&&!s.call(d,h)||(i[h]=d[h]);return i}:gt;q({target:"Object",stat:!0,forced:Object.assign!==mt},{assign:mt});var bt=F.Object.assign;function wt(t,e,i,o){t.beginPath(),t.arc(e,i,o,0,2*Math.PI,!1),t.closePath();}function kt(t,e,i,o,n,r){var s=Math.PI/180;o-2*r<0&&(r=o/2),n-2*r<0&&(r=n/2),t.beginPath(),t.moveTo(e+r,i),t.lineTo(e+o-r,i),t.arc(e+o-r,i+r,r,270*s,360*s,!1),t.lineTo(e+o,i+n-r),t.arc(e+o-r,i+n-r,r,0,90*s,!1),t.lineTo(e+r,i+n),t.arc(e+r,i+n-r,r,90*s,180*s,!1),t.lineTo(e,i+r),t.arc(e+r,i+r,r,180*s,270*s,!1),t.closePath();}function _t(t,e,i,o,n){var r=.5522848,s=o/2*r,a=n/2*r,h=e+o,d=i+n,l=e+o/2,c=i+n/2;t.beginPath(),t.moveTo(e,c),t.bezierCurveTo(e,c-a,l-s,i,l,i),t.bezierCurveTo(l+s,i,h,c-a,h,c),t.bezierCurveTo(h,c+a,l+s,d,l,d),t.bezierCurveTo(l-s,d,e,c+a,e,c),t.closePath();}function xt(t,e,i,o,n){var r=n*(1/3),s=.5522848,a=o/2*s,h=r/2*s,d=e+o,l=i+r,c=e+o/2,u=i+r/2,f=i+(n-r/2),p=i+n;t.beginPath(),t.moveTo(d,u),t.bezierCurveTo(d,u+h,c+a,l,c,l),t.bezierCurveTo(c-a,l,e,u+h,e,u),t.bezierCurveTo(e,u-h,c-a,i,c,i),t.bezierCurveTo(c+a,i,d,u-h,d,u),t.lineTo(d,f),t.bezierCurveTo(d,f+h,c+a,p,c,p),t.bezierCurveTo(c-a,p,e,f+h,e,f),t.lineTo(e,u);}function Et(t,e,i,o,n,r){t.beginPath(),t.moveTo(e,i);for(var s=r.length,a=o-e,h=n-i,d=h/a,l=Math.sqrt(a*a+h*h),c=0,u=!0,f=0,p=+r[0];l>=.1;)(p=+r[c++%s])>l&&(p=l),f=Math.sqrt(p*p/(1+d*d)),e+=f=a<0?-f:f,i+=d*f,!0===u?t.lineTo(e,i):t.moveTo(e,i),l-=p,u=!u;}var Ot={circle:wt,dashedLine:Et,database:xt,diamond:function(t,e,i,o){t.beginPath(),t.lineTo(e,i+o),t.lineTo(e+o,i),t.lineTo(e,i-o),t.lineTo(e-o,i),t.closePath();},ellipse:_t,ellipse_vis:_t,hexagon:function(t,e,i,o){t.beginPath();var n=2*Math.PI/6;t.moveTo(e+o,i);for(var r=1;r<6;r++)t.lineTo(e+o*Math.cos(n*r),i+o*Math.sin(n*r));t.closePath();},roundRect:kt,square:function(t,e,i,o){t.beginPath(),t.rect(e-o,i-o,2*o,2*o),t.closePath();},star:function(t,e,i,o){t.beginPath(),i+=.1*(o*=.82);for(var n=0;n<10;n++){var r=n%2==0?1.3*o:.5*o;t.lineTo(e+r*Math.sin(2*n*Math.PI/10),i-r*Math.cos(2*n*Math.PI/10));}t.closePath();},triangle:function(t,e,i,o){t.beginPath(),i+=.275*(o*=1.15);var n=2*o,r=n/2,s=Math.sqrt(3)/6*n,a=Math.sqrt(n*n-r*r);t.moveTo(e,i-(a-s)),t.lineTo(e+r,i+s),t.lineTo(e-r,i+s),t.lineTo(e,i-(a-s)),t.closePath();},triangleDown:function(t,e,i,o){t.beginPath(),i-=.275*(o*=1.15);var n=2*o,r=n/2,s=Math.sqrt(3)/6*n,a=Math.sqrt(n*n-r*r);t.moveTo(e,i+(a-s)),t.lineTo(e+r,i-s),t.lineTo(e-r,i-s),t.lineTo(e,i+(a-s)),t.closePath();}};var Ct=o((function(t){function e(t){if(t)return function(t){for(var i in e.prototype)t[i]=e.prototype[i];return t}(t)}t.exports=e,e.prototype.on=e.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},e.prototype.once=function(t,e){function i(){this.off(t,i),e.apply(this,arguments);}return i.fn=e,this.on(t,i),this},e.prototype.off=e.prototype.removeListener=e.prototype.removeAllListeners=e.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var i,o=this._callbacks["$"+t];if(!o)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var n=0;n<o.length;n++)if((i=o[n])===e||i.fn===e){o.splice(n,1);break}return 0===o.length&&delete this._callbacks["$"+t],this},e.prototype.emit=function(t){this._callbacks=this._callbacks||{};for(var e=new Array(arguments.length-1),i=this._callbacks["$"+t],o=1;o<arguments.length;o++)e[o-1]=arguments[o];if(i){o=0;for(var n=(i=i.slice(0)).length;o<n;++o)i[o].apply(this,e);}return this},e.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},e.prototype.hasListeners=function(t){return !!this.listeners(t).length};}));q({target:"Object",stat:!0,forced:!a,sham:!a},{defineProperty:L.f});var St=o((function(t){var e=F.Object,i=t.exports=function(t,i,o){return e.defineProperty(t,i,o)};e.defineProperty.sham&&(i.sham=!0);})),Tt=St,Mt=a?Object.defineProperties:function(t,e){R(t);for(var i,o=ft(e),n=o.length,r=0;n>r;)L.f(t,i=o[r++],e[i]);return t};q({target:"Object",stat:!0,forced:!a,sham:!a},{defineProperties:Mt});var Dt=o((function(t){var e=F.Object,i=t.exports=function(t,i){return e.defineProperties(t,i)};e.defineProperties.sham&&(i.sham=!0);})),Pt=function(t){return "function"==typeof t?t:void 0},It=function(t,e){return arguments.length<2?Pt(F[t])||Pt(r[t]):F[t]&&F[t][e]||r[t]&&r[t][e]},zt=ut.concat("length","prototype"),Bt={f:Object.getOwnPropertyNames||function(t){return ct(t,zt)}},Ft=It("Reflect","ownKeys")||function(t){var e=Bt.f(R(t)),i=pt.f;return i?e.concat(i(t)):e},Nt=function(t,e,i){var o=b(e);o in t?L.f(t,o,c(0,i)):t[o]=i;};q({target:"Object",stat:!0,sham:!a},{getOwnPropertyDescriptors:function(t){for(var e,i,o=y(t),n=S.f,r=Ft(o),s={},a=0;r.length>a;)void 0!==(i=n(o,e=r[a++]))&&Nt(s,e,i);return s}});var At=F.Object.getOwnPropertyDescriptors,Rt=S.f,jt=s((function(){Rt(1);}));q({target:"Object",stat:!0,forced:!a||jt,sham:!a},{getOwnPropertyDescriptor:function(t,e){return Rt(y(t),e)}});var Lt,Ht=o((function(t){var e=F.Object,i=t.exports=function(t,i){return e.getOwnPropertyDescriptor(t,i)};e.getOwnPropertyDescriptor.sham&&(i.sham=!0);})),Wt=Ht,Vt=!!Object.getOwnPropertySymbols&&!s((function(){return !String(Symbol())})),qt=Vt&&!Symbol.sham&&"symbol"==typeof Symbol.iterator,Ut=Array.isArray||function(t){return "Array"==f(t)},Yt=It("document","documentElement"),Xt="__core-js_shared__",Gt=r[Xt]||function(t,e){try{H(r,t,e);}catch(i){r[t]=e;}return e}(Xt,{}),Kt=o((function(t){(t.exports=function(t,e){return Gt[t]||(Gt[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.7.0",mode:"pure",copyright:"© 2020 Denis Pushkarev (zloirock.ru)"});})),$t=0,Zt=Math.random(),Qt=function(t){return "Symbol("+String(void 0===t?"":t)+")_"+(++$t+Zt).toString(36)},Jt=Kt("keys"),te=function(t){return Jt[t]||(Jt[t]=Qt(t))},ee=te("IE_PROTO"),ie=function(){},oe=function(t){return "<script>"+t+"</"+"script>"},ne=function(){try{Lt=document.domain&&new ActiveXObject("htmlfile");}catch(t){}var t,e;ne=Lt?function(t){t.write(oe("")),t.close();var e=t.parentWindow.Object;return t=null,e}(Lt):((e=E("iframe")).style.display="none",Yt.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write(oe("document.F=Object")),t.close(),t.F);for(var i=ut.length;i--;)delete ne.prototype[ut[i]];return ne()};dt[ee]=!0;var re=Object.create||function(t,e){var i;return null!==t?(ie.prototype=R(t),i=new ie,ie.prototype=null,i[ee]=t):i=ne(),void 0===e?i:Mt(i,e)},se=Bt.f,ae={}.toString,he="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],de={f:function(t){return he&&"[object Window]"==ae.call(t)?function(t){try{return se(t)}catch(t){return he.slice()}}(t):se(y(t))}},le=function(t,e,i,o){o&&o.enumerable?t[e]=i:H(t,e,i);},ce=Kt("wks"),ue=r.Symbol,fe=qt?ue:ue&&ue.withoutSetter||Qt,pe=function(t){return k(ce,t)||(Vt&&k(ue,t)?ce[t]=ue[t]:ce[t]=fe("Symbol."+t)),ce[t]},ve={f:pe},ge=L.f,ye=function(t){var e=F.Symbol||(F.Symbol={});k(e,t)||ge(e,t,{value:ve.f(t)});},me={};me[pe("toStringTag")]="z";var be="[object z]"===String(me),we=pe("toStringTag"),ke="Arguments"==f(function(){return arguments}()),_e=be?f:function(t){var e,i,o;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(i=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),we))?i:ke?f(e):"Object"==(o=f(e))&&"function"==typeof e.callee?"Arguments":o},xe=be?{}.toString:function(){return "[object "+_e(this)+"]"},Ee=L.f,Oe=pe("toStringTag"),Ce=function(t,e,i,o){if(t){var n=i?t:t.prototype;k(n,Oe)||Ee(n,Oe,{configurable:!0,value:e}),o&&!be&&H(n,"toString",xe);}},Se=Function.toString;"function"!=typeof Gt.inspectSource&&(Gt.inspectSource=function(t){return Se.call(t)});var Te,Me,De,Pe=Gt.inspectSource,Ie=r.WeakMap,ze="function"==typeof Ie&&/native code/.test(Pe(Ie)),Be=r.WeakMap;if(ze){var Fe=Gt.state||(Gt.state=new Be),Ne=Fe.get,Ae=Fe.has,Re=Fe.set;Te=function(t,e){return e.facade=t,Re.call(Fe,t,e),e},Me=function(t){return Ne.call(Fe,t)||{}},De=function(t){return Ae.call(Fe,t)};}else {var je=te("state");dt[je]=!0,Te=function(t,e){return e.facade=t,H(t,je,e),e},Me=function(t){return k(t,je)?t[je]:{}},De=function(t){return k(t,je)};}var Le={set:Te,get:Me,has:De,enforce:function(t){return De(t)?Me(t):Te(t,{})},getterFor:function(t){return function(e){var i;if(!m(e)||(i=Me(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return i}}},He=pe("species"),We=function(t,e){var i;return Ut(t)&&("function"!=typeof(i=t.constructor)||i!==Array&&!Ut(i.prototype)?m(i)&&null===(i=i[He])&&(i=void 0):i=void 0),new(void 0===i?Array:i)(0===e?0:e)},Ve=[].push,qe=function(t){var e=1==t,i=2==t,o=3==t,n=4==t,r=6==t,s=5==t||r;return function(a,h,d,l){for(var c,u,f=vt(a),p=v(f),g=A(h,d,3),y=ot(p.length),m=0,b=l||We,w=e?b(a,y):i?b(a,0):void 0;y>m;m++)if((s||m in p)&&(u=g(c=p[m],m,f),t))if(e)w[m]=u;else if(u)switch(t){case 3:return !0;case 5:return c;case 6:return m;case 2:Ve.call(w,c);}else if(n)return !1;return r?-1:o||n?n:w}},Ue={forEach:qe(0),map:qe(1),filter:qe(2),some:qe(3),every:qe(4),find:qe(5),findIndex:qe(6)},Ye=Ue.forEach,Xe=te("hidden"),Ge="Symbol",Ke=pe("toPrimitive"),$e=Le.set,Ze=Le.getterFor(Ge),Qe=Object.prototype,Je=r.Symbol,ti=It("JSON","stringify"),ei=S.f,ii=L.f,oi=de.f,ni=l.f,ri=Kt("symbols"),si=Kt("op-symbols"),ai=Kt("string-to-symbol-registry"),hi=Kt("symbol-to-string-registry"),di=Kt("wks"),li=r.QObject,ci=!li||!li.prototype||!li.prototype.findChild,ui=a&&s((function(){return 7!=re(ii({},"a",{get:function(){return ii(this,"a",{value:7}).a}})).a}))?function(t,e,i){var o=ei(Qe,e);o&&delete Qe[e],ii(t,e,i),o&&t!==Qe&&ii(Qe,e,o);}:ii,fi=function(t,e){var i=ri[t]=re(Je.prototype);return $e(i,{type:Ge,tag:t,description:e}),a||(i.description=e),i},pi=qt?function(t){return "symbol"==typeof t}:function(t){return Object(t)instanceof Je},vi=function(t,e,i){t===Qe&&vi(si,e,i),R(t);var o=b(e,!0);return R(i),k(ri,o)?(i.enumerable?(k(t,Xe)&&t[Xe][o]&&(t[Xe][o]=!1),i=re(i,{enumerable:c(0,!1)})):(k(t,Xe)||ii(t,Xe,c(1,{})),t[Xe][o]=!0),ui(t,o,i)):ii(t,o,i)},gi=function(t,e){R(t);var i=y(e),o=ft(i).concat(wi(i));return Ye(o,(function(e){a&&!yi.call(i,e)||vi(t,e,i[e]);})),t},yi=function(t){var e=b(t,!0),i=ni.call(this,e);return !(this===Qe&&k(ri,e)&&!k(si,e))&&(!(i||!k(this,e)||!k(ri,e)||k(this,Xe)&&this[Xe][e])||i)},mi=function(t,e){var i=y(t),o=b(e,!0);if(i!==Qe||!k(ri,o)||k(si,o)){var n=ei(i,o);return !n||!k(ri,o)||k(i,Xe)&&i[Xe][o]||(n.enumerable=!0),n}},bi=function(t){var e=oi(y(t)),i=[];return Ye(e,(function(t){k(ri,t)||k(dt,t)||i.push(t);})),i},wi=function(t){var e=t===Qe,i=oi(e?si:y(t)),o=[];return Ye(i,(function(t){!k(ri,t)||e&&!k(Qe,t)||o.push(ri[t]);})),o};if(Vt||(le((Je=function(){if(this instanceof Je)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=Qt(t),i=function(t){this===Qe&&i.call(si,t),k(this,Xe)&&k(this[Xe],e)&&(this[Xe][e]=!1),ui(this,e,c(1,t));};return a&&ci&&ui(Qe,e,{configurable:!0,set:i}),fi(e,t)}).prototype,"toString",(function(){return Ze(this).tag})),le(Je,"withoutSetter",(function(t){return fi(Qt(t),t)})),l.f=yi,L.f=vi,S.f=mi,Bt.f=de.f=bi,pt.f=wi,ve.f=function(t){return fi(pe(t),t)},a&&ii(Je.prototype,"description",{configurable:!0,get:function(){return Ze(this).description}})),q({global:!0,wrap:!0,forced:!Vt,sham:!Vt},{Symbol:Je}),Ye(ft(di),(function(t){ye(t);})),q({target:Ge,stat:!0,forced:!Vt},{for:function(t){var e=String(t);if(k(ai,e))return ai[e];var i=Je(e);return ai[e]=i,hi[i]=e,i},keyFor:function(t){if(!pi(t))throw TypeError(t+" is not a symbol");if(k(hi,t))return hi[t]},useSetter:function(){ci=!0;},useSimple:function(){ci=!1;}}),q({target:"Object",stat:!0,forced:!Vt,sham:!a},{create:function(t,e){return void 0===e?re(t):gi(re(t),e)},defineProperty:vi,defineProperties:gi,getOwnPropertyDescriptor:mi}),q({target:"Object",stat:!0,forced:!Vt},{getOwnPropertyNames:bi,getOwnPropertySymbols:wi}),q({target:"Object",stat:!0,forced:s((function(){pt.f(1);}))},{getOwnPropertySymbols:function(t){return pt.f(vt(t))}}),ti){var ki=!Vt||s((function(){var t=Je();return "[null]"!=ti([t])||"{}"!=ti({a:t})||"{}"!=ti(Object(t))}));q({target:"JSON",stat:!0,forced:ki},{stringify:function(t,e,i){for(var o,n=[t],r=1;arguments.length>r;)n.push(arguments[r++]);if(o=e,(m(e)||void 0!==t)&&!pi(t))return Ut(e)||(e=function(t,e){if("function"==typeof o&&(e=o.call(this,t,e)),!pi(e))return e}),n[1]=e,ti.apply(null,n)}});}Je.prototype[Ke]||H(Je.prototype,Ke,Je.prototype.valueOf),Ce(Je,Ge),dt[Xe]=!0;var _i,xi,Ei,Oi=F.Object.getOwnPropertySymbols,Ci={},Si=!s((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),Ti=te("IE_PROTO"),Mi=Object.prototype,Di=Si?Object.getPrototypeOf:function(t){return t=vt(t),k(t,Ti)?t[Ti]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?Mi:null},Pi=(pe("iterator"),!1);[].keys&&("next"in(Ei=[].keys())?(xi=Di(Di(Ei)))!==Object.prototype&&(_i=xi):Pi=!0),null==_i&&(_i={});var Ii={IteratorPrototype:_i,BUGGY_SAFARI_ITERATORS:Pi},zi=Ii.IteratorPrototype,Bi=function(){return this},Fi=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,i={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(i,[]),e=i instanceof Array;}catch(t){}return function(i,o){return R(i),function(t){if(!m(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype")}(o),e?t.call(i,o):i.__proto__=o,i}}():void 0),Ni=Ii.IteratorPrototype,Ai=Ii.BUGGY_SAFARI_ITERATORS,Ri=pe("iterator"),ji="keys",Li="values",Hi="entries",Wi=function(){return this},Vi=function(t,e,i,o,n,r,s){!function(t,e,i){var o=e+" Iterator";t.prototype=re(zi,{next:c(1,i)}),Ce(t,o,!1,!0),Ci[o]=Bi;}(i,e,o);var a,h,d,l=function(t){if(t===n&&g)return g;if(!Ai&&t in p)return p[t];switch(t){case ji:case Li:case Hi:return function(){return new i(this,t)}}return function(){return new i(this)}},u=e+" Iterator",f=!1,p=t.prototype,v=p[Ri]||p["@@iterator"]||n&&p[n],g=!Ai&&v||l(n),y="Array"==e&&p.entries||v;if(y&&(a=Di(y.call(new t)),Ni!==Object.prototype&&a.next&&(Ce(a,u,!0,!0),Ci[u]=Wi)),n==Li&&v&&v.name!==Li&&(f=!0,g=function(){return v.call(this)}),s&&p[Ri]!==g&&H(p,Ri,g),Ci[e]=g,n)if(h={values:l(Li),keys:r?g:l(ji),entries:l(Hi)},s)for(d in h)(Ai||f||!(d in p))&&le(p,d,h[d]);else q({target:e,proto:!0,forced:Ai||f},h);return h},qi="Array Iterator",Ui=Le.set,Yi=Le.getterFor(qi);Vi(Array,"Array",(function(t,e){Ui(this,{type:qi,target:y(t),index:0,kind:e});}),(function(){var t=Yi(this),e=t.target,i=t.kind,o=t.index++;return !e||o>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==i?{value:o,done:!1}:"values"==i?{value:e[o],done:!1}:{value:[o,e[o]],done:!1}}),"values");Ci.Arguments=Ci.Array;var Xi=pe("toStringTag");for(var Gi in {CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}){var Ki=r[Gi],$i=Ki&&Ki.prototype;$i&&_e($i)!==Xi&&H($i,Xi,Gi),Ci[Gi]=Ci.Array;}var Zi=function(t){return function(e,i){var o,n,r=String(g(e)),s=et(i),a=r.length;return s<0||s>=a?t?"":void 0:(o=r.charCodeAt(s))<55296||o>56319||s+1===a||(n=r.charCodeAt(s+1))<56320||n>57343?t?r.charAt(s):o:t?r.slice(s,s+2):n-56320+(o-55296<<10)+65536}},Qi={codeAt:Zi(!1),charAt:Zi(!0)}.charAt,Ji="String Iterator",to=Le.set,eo=Le.getterFor(Ji);Vi(String,"String",(function(t){to(this,{type:Ji,string:String(t),index:0});}),(function(){var t,e=eo(this),i=e.string,o=e.index;return o>=i.length?{value:void 0,done:!0}:(t=Qi(i,o),e.index+=t.length,{value:t,done:!1})}));var io=pe("iterator"),oo=function(t){if(null!=t)return t[io]||t["@@iterator"]||Ci[_e(t)]},no=function(t){var e=oo(t);if("function"!=typeof e)throw TypeError(String(t)+" is not iterable");return R(e.call(t))},ro=oo,so=function(t){var e=t.return;if(void 0!==e)return R(e.call(t)).value},ao=function(t,e,i,o){try{return o?e(R(i)[0],i[1]):e(i)}catch(e){throw so(t),e}},ho=pe("iterator"),lo=Array.prototype,co=function(t){return void 0!==t&&(Ci.Array===t||lo[ho]===t)},uo=pe("iterator"),fo=!1;try{var po=0,vo={next:function(){return {done:!!po++}},return:function(){fo=!0;}};vo[uo]=function(){return this},Array.from(vo,(function(){throw 2}));}catch(t){}var go=!function(t,e){if(!e&&!fo)return !1;var i=!1;try{var o={};o[uo]=function(){return {next:function(){return {done:i=!0}}}},t(o);}catch(t){}return i}((function(t){Array.from(t);}));q({target:"Array",stat:!0,forced:go},{from:function(t){var e,i,o,n,r,s,a=vt(t),h="function"==typeof this?this:Array,d=arguments.length,l=d>1?arguments[1]:void 0,c=void 0!==l,u=oo(a),f=0;if(c&&(l=A(l,d>2?arguments[2]:void 0,2)),null==u||h==Array&&co(u))for(i=new h(e=ot(a.length));e>f;f++)s=c?l(a[f],f):a[f],Nt(i,f,s);else for(r=(n=u.call(a)).next,i=new h;!(o=r.call(n)).done;f++)s=c?ao(n,l,[o.value,f],!0):o.value,Nt(i,f,s);return i.length=f,i}});var yo=F.Array.from,mo=yo;q({target:"Object",stat:!0,sham:!a},{create:re});var bo=F.Object,wo=function(t,e){return bo.create(t,e)},ko=wo,_o=St;var xo,Eo=function(t,e,i){return e in t?_o(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t},Oo="\t\n\v\f\r                　\u2028\u2029\ufeff",Co="["+Oo+"]",So=RegExp("^"+Co+Co+"*"),To=RegExp(Co+Co+"*$"),Mo=function(t){return function(e){var i=String(g(e));return 1&t&&(i=i.replace(So,"")),2&t&&(i=i.replace(To,"")),i}},Do={start:Mo(1),end:Mo(2),trim:Mo(3)},Po=Do.trim;q({target:"String",proto:!0,forced:(xo="trim",s((function(){return !!Oo[xo]()||"​᠎"!="​᠎"[xo]()||Oo[xo].name!==xo})))},{trim:function(){return Po(this)}});K("String").trim;var Io=function(t,e){var i=[][t];return !!i&&s((function(){i.call(null,e||function(){throw 1},1);}))},zo=Object.defineProperty,Bo={},Fo=function(t){throw t},No=function(t,e){if(k(Bo,t))return Bo[t];e||(e={});var i=[][t],o=!!k(e,"ACCESSORS")&&e.ACCESSORS,n=k(e,0)?e[0]:Fo,r=k(e,1)?e[1]:void 0;return Bo[t]=!!i&&!s((function(){if(o&&!a)return !0;var t={length:-1};o?zo(t,1,{enumerable:!0,get:Fo}):t[1]=1,i.call(t,n,r);}))},Ao=Ue.forEach,Ro=Io("forEach"),jo=No("forEach"),Lo=Ro&&jo?[].forEach:function(t){return Ao(this,t,arguments.length>1?arguments[1]:void 0)};q({target:"Array",proto:!0,forced:[].forEach!=Lo},{forEach:Lo});var Ho=K("Array").forEach,Wo=Array.prototype,Vo={DOMTokenList:!0,NodeList:!0},qo=function(t){var e=t.forEach;return t===Wo||t instanceof Array&&e===Wo.forEach||Vo.hasOwnProperty(_e(t))?Ho:e},Uo=Do.trim,Yo=r.parseInt,Xo=/^[+-]?0[Xx]/,Go=8!==Yo(Oo+"08")||22!==Yo(Oo+"0x16")?function(t,e){var i=Uo(String(t));return Yo(i,e>>>0||(Xo.test(i)?16:10))}:Yo;q({global:!0,forced:parseInt!=Go},{parseInt:Go});var Ko=F.parseInt,$o=l.f,Zo=function(t){return function(e){for(var i,o=y(e),n=ft(o),r=n.length,s=0,h=[];r>s;)i=n[s++],a&&!$o.call(o,i)||h.push(t?[i,o[i]]:o[i]);return h}},Qo={entries:Zo(!0),values:Zo(!1)}.values;q({target:"Object",stat:!0},{values:function(t){return Qo(t)}});F.Object.values;var Jo,tn,en=It("navigator","userAgent")||"",on=r.process,nn=on&&on.versions,rn=nn&&nn.v8;rn?tn=(Jo=rn.split("."))[0]+Jo[1]:en&&(!(Jo=en.match(/Edge\/(\d+)/))||Jo[1]>=74)&&(Jo=en.match(/Chrome\/(\d+)/))&&(tn=Jo[1]);var sn=tn&&+tn,an=pe("species"),hn=function(t){return sn>=51||!s((function(){var e=[];return (e.constructor={})[an]=function(){return {foo:1}},1!==e[t](Boolean).foo}))},dn=Ue.filter,ln=hn("filter"),cn=No("filter");q({target:"Array",proto:!0,forced:!ln||!cn},{filter:function(t){return dn(this,t,arguments.length>1?arguments[1]:void 0)}});var un=K("Array").filter,fn=Array.prototype,pn=function(t){var e=t.filter;return t===fn||t instanceof Array&&e===fn.filter?un:e},vn=s((function(){Di(1);}));q({target:"Object",stat:!0,forced:vn,sham:!Si},{getPrototypeOf:function(t){return Di(vt(t))}});var gn=F.Object.getPrototypeOf,yn=gn,mn=ht.indexOf,bn=[].indexOf,wn=!!bn&&1/[1].indexOf(1,-0)<0,kn=Io("indexOf"),_n=No("indexOf",{ACCESSORS:!0,1:0});q({target:"Array",proto:!0,forced:wn||!kn||!_n},{indexOf:function(t){return wn?bn.apply(this,arguments)||0:mn(this,t,arguments.length>1?arguments[1]:void 0)}});var xn=K("Array").indexOf,En=Array.prototype,On=function(t){var e=t.indexOf;return t===En||t instanceof Array&&e===En.indexOf?xn:e};q({target:"Array",stat:!0},{isArray:Ut});var Cn=F.Array.isArray,Sn=Cn;var Tn=function(t){if(Sn(t))return t},Mn=pe("iterator"),Dn=function(t){var e=Object(t);return void 0!==e[Mn]||"@@iterator"in e||Ci.hasOwnProperty(_e(e))},Pn=pe("isConcatSpreadable"),In=9007199254740991,zn="Maximum allowed index exceeded",Bn=sn>=51||!s((function(){var t=[];return t[Pn]=!1,t.concat()[0]!==t})),Fn=hn("concat"),Nn=function(t){if(!m(t))return !1;var e=t[Pn];return void 0!==e?!!e:Ut(t)};q({target:"Array",proto:!0,forced:!Bn||!Fn},{concat:function(t){var e,i,o,n,r,s=vt(this),a=We(s,0),h=0;for(e=-1,o=arguments.length;e<o;e++)if(Nn(r=-1===e?s:arguments[e])){if(h+(n=ot(r.length))>In)throw TypeError(zn);for(i=0;i<n;i++,h++)i in r&&Nt(a,h,r[i]);}else {if(h>=In)throw TypeError(zn);Nt(a,h++,r);}return a.length=h,a}}),ye("asyncIterator"),ye("hasInstance"),ye("isConcatSpreadable"),ye("iterator"),ye("match"),ye("matchAll"),ye("replace"),ye("search"),ye("species"),ye("split"),ye("toPrimitive"),ye("toStringTag"),ye("unscopables"),Ce(r.JSON,"JSON",!0);var An=F.Symbol;ye("asyncDispose"),ye("dispose"),ye("observable"),ye("patternMatch"),ye("replaceAll");var Rn=An;var jn=function(t,e){if(void 0!==Rn&&Dn(Object(t))){var i=[],o=!0,n=!1,r=void 0;try{for(var s,a=no(t);!(o=(s=a.next()).done)&&(i.push(s.value),!e||i.length!==e);o=!0);}catch(t){n=!0,r=t;}finally{try{o||null==a.return||a.return();}finally{if(n)throw r}}return i}},Ln=yo,Hn=hn("slice"),Wn=No("slice",{ACCESSORS:!0,0:0,1:2}),Vn=pe("species"),qn=[].slice,Un=Math.max;q({target:"Array",proto:!0,forced:!Hn||!Wn},{slice:function(t,e){var i,o,n,r=y(this),s=ot(r.length),a=st(t,s),h=st(void 0===e?s:e,s);if(Ut(r)&&("function"!=typeof(i=r.constructor)||i!==Array&&!Ut(i.prototype)?m(i)&&null===(i=i[Vn])&&(i=void 0):i=void 0,i===Array||void 0===i))return qn.call(r,a,h);for(o=new(void 0===i?Array:i)(Un(h-a,0)),n=0;a<h;a++,n++)a in r&&Nt(o,n,r[a]);return o.length=n,o}});var Yn=K("Array").slice,Xn=Array.prototype,Gn=function(t){var e=t.slice;return t===Xn||t instanceof Array&&e===Xn.slice?Yn:e},Kn=Gn;var $n=function(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o};var Zn=function(t,e){var i;if(t){if("string"==typeof t)return $n(t,e);var o=Kn(i=Object.prototype.toString.call(t)).call(i,8,-1);return "Object"===o&&t.constructor&&(o=t.constructor.name),"Map"===o||"Set"===o?Ln(t):"Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o)?$n(t,e):void 0}};var Qn=function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")};var Jn=function(t,e){return Tn(t)||jn(t,e)||Zn(t,e)||Qn()};q({target:"Date",stat:!0},{now:function(){return (new Date).getTime()}});var tr=F.Date.now,er=s((function(){ft(1);}));q({target:"Object",stat:!0,forced:er},{keys:function(t){return ft(vt(t))}});var ir=F.Object.keys,or=Ue.map,nr=hn("map"),rr=No("map");q({target:"Array",proto:!0,forced:!nr||!rr},{map:function(t){return or(this,t,arguments.length>1?arguments[1]:void 0)}});var sr=K("Array").map,ar=Array.prototype,hr=function(t){var e=t.map;return t===ar||t instanceof Array&&e===ar.map?sr:e},dr=Cn,lr=ve.f("iterator"),cr=o((function(t){function e(i){return t.exports=e="function"==typeof Rn&&"symbol"==typeof lr?function(t){return typeof t}:function(t){return t&&"function"==typeof Rn&&t.constructor===Rn&&t!==Rn.prototype?"symbol":typeof t},e(i)}t.exports=e;}));q({target:"Reflect",stat:!0},{ownKeys:Ft});F.Reflect.ownKeys;var ur=Gn;var fr=function(t){if(Sn(t))return $n(t)};var pr=function(t){if(void 0!==Rn&&Dn(Object(t)))return Ln(t)};var vr=function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")};var gr=function(t){return fr(t)||pr(t)||Zn(t)||vr()},yr=K("Array").concat,mr=Array.prototype,br=function(t){var e=t.concat;return t===mr||t instanceof Array&&e===mr.concat?yr:e},wr=An;function kr(t,e){var i;if(void 0===wr||null==ro(t)){if(dr(t)||(i=function(t,e){var i;if(!t)return;if("string"==typeof t)return _r(t,e);var o=ur(i=Object.prototype.toString.call(t)).call(i,8,-1);"Object"===o&&t.constructor&&(o=t.constructor.name);if("Map"===o||"Set"===o)return mo(t);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return _r(t,e)}(t))||e&&t&&"number"==typeof t.length){i&&(t=i);var o=0,n=function(){};return {s:n,n:function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}},e:function(t){throw t},f:n}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var r,s=!0,a=!1;return {s:function(){i=no(t);},n:function(){var t=i.next();return s=t.done,t},e:function(t){a=!0,r=t;},f:function(){try{s||null==i.return||i.return();}finally{if(a)throw r}}}}function _r(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o}
    /**
    	 * vis-util
    	 * https://github.com/visjs/vis-util
    	 *
    	 * utilitie collection for visjs
    	 *
    	 * @version 4.3.4
    	 * @date    2020-08-01T15:11:53.524Z
    	 *
    	 * @copyright (c) 2011-2017 Almende B.V, http://almende.com
    	 * @copyright (c) 2017-2019 visjs contributors, https://github.com/visjs
    	 *
    	 * @license
    	 * vis.js is dual licensed under both
    	 *
    	 *   1. The Apache 2.0 License
    	 *      http://www.apache.org/licenses/LICENSE-2.0
    	 *
    	 *   and
    	 *
    	 *   2. The MIT License
    	 *      http://opensource.org/licenses/MIT
    	 *
    	 * vis.js may be distributed under either license.
    	 */wr("DELETE");function xr(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];return Er(e.length?e:[tr()])}function Er(t){var e=function(){for(var t=Or(),e=t(" "),i=t(" "),o=t(" "),n=0;n<arguments.length;n++)(e-=t(n<0||arguments.length<=n?void 0:arguments[n]))<0&&(e+=1),(i-=t(n<0||arguments.length<=n?void 0:arguments[n]))<0&&(i+=1),(o-=t(n<0||arguments.length<=n?void 0:arguments[n]))<0&&(o+=1);return [e,i,o]}(t),i=Jn(e,3),o=i[0],n=i[1],r=i[2],s=1,a=function(){var t=2091639*o+2.3283064365386963e-10*s;return o=n,n=r,r=t-(s=0|t)};return a.uint32=function(){return 4294967296*a()},a.fract53=function(){return a()+11102230246251565e-32*(2097152*a()|0)},a.algorithm="Alea",a.seed=t,a.version="0.9",a}function Or(){var t=4022871197;return function(e){for(var i=e.toString(),o=0;o<i.length;o++){var n=.02519603282416938*(t+=i.charCodeAt(o));n-=t=n>>>0,t=(n*=t)>>>0,t+=4294967296*(n-=t);}return 2.3283064365386963e-10*(t>>>0)}}var Cr=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,Sr=/^#?([a-f\d])([a-f\d])([a-f\d])$/i,Tr=/^rgb\( *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *\)$/i,Mr=/^rgba\( *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *(1?\d{1,2}|2[0-4]\d|25[0-5]) *, *([01]|0?\.\d+) *\)$/i;function Dr(t){if(t)for(;!0===t.hasChildNodes();){var e=t.firstChild;e&&(Dr(e),t.removeChild(e));}}function Pr(t){return t instanceof String||"string"==typeof t}function Ir(t){return "object"===cr(t)&&null!==t}function zr(t,e,i,o){var n=!1;!0===o&&(n=null===e[i]&&void 0!==t[i]),n?delete t[i]:t[i]=e[i];}function Br(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2];for(var o in t)if(void 0!==e[o])if(null===e[o]||"object"!==cr(e[o]))zr(t,e,o,i);else {var n=t[o],r=e[o];Ir(n)&&Ir(r)&&Br(n,r,i);}}function Fr(t,e,i){var o=arguments.length>3&&void 0!==arguments[3]&&arguments[3];if(dr(i))throw new TypeError("Arrays are not supported by deepExtend");for(var n=0;n<t.length;n++){var r=t[n];if(Object.prototype.hasOwnProperty.call(i,r))if(i[r]&&i[r].constructor===Object)void 0===e[r]&&(e[r]={}),e[r].constructor===Object?Ar(e[r],i[r],!1,o):zr(e,i,r,o);else {if(dr(i[r]))throw new TypeError("Arrays are not supported by deepExtend");zr(e,i,r,o);}}return e}function Nr(t,e,i){var o=arguments.length>3&&void 0!==arguments[3]&&arguments[3];if(dr(i))throw new TypeError("Arrays are not supported by deepExtend");for(var n in i)if(Object.prototype.hasOwnProperty.call(i,n)&&-1===On(t).call(t,n))if(i[n]&&i[n].constructor===Object)void 0===e[n]&&(e[n]={}),e[n].constructor===Object?Ar(e[n],i[n]):zr(e,i,n,o);else if(dr(i[n])){e[n]=[];for(var r=0;r<i[n].length;r++)e[n].push(i[n][r]);}else zr(e,i,n,o);return e}function Ar(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=arguments.length>3&&void 0!==arguments[3]&&arguments[3];for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)||!0===i)if("object"===cr(e[n])&&null!==e[n]&&yn(e[n])===Object.prototype)void 0===t[n]?t[n]=Ar({},e[n],i):"object"===cr(t[n])&&null!==t[n]&&yn(t[n])===Object.prototype?Ar(t[n],e[n],i):zr(t,e,n,o);else if(dr(e[n])){var r;t[n]=ur(r=e[n]).call(r);}else zr(t,e,n,o);return t}function Rr(t,e){var i;return br(i=[]).call(i,gr(t),[e])}function jr(t){return ur(t).call(t)}function Lr(t){return t.getBoundingClientRect().top}function Hr(t,e){if(dr(t))for(var i=t.length,o=0;o<i;o++)e(t[o],o,t);else for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&e(t[n],n,t);}function Wr(t){var e;switch(t.length){case 3:case 4:return (e=Sr.exec(t))?{r:Ko(e[1]+e[1],16),g:Ko(e[2]+e[2],16),b:Ko(e[3]+e[3],16)}:null;case 6:case 7:return (e=Cr.exec(t))?{r:Ko(e[1],16),g:Ko(e[2],16),b:Ko(e[3],16)}:null;default:return null}}function Vr(t,e){if(-1!==On(t).call(t,"rgba"))return t;if(-1!==On(t).call(t,"rgb")){var i=t.substr(On(t).call(t,"(")+1).replace(")","").split(",");return "rgba("+i[0]+","+i[1]+","+i[2]+","+e+")"}var o=Wr(t);return null==o?t:"rgba("+o.r+","+o.g+","+o.b+","+e+")"}function qr(t,e,i){var o;return "#"+ur(o=((1<<24)+(t<<16)+(e<<8)+i).toString(16)).call(o,1)}function Ur(t,e){if(Pr(t)){var i=t;if($r(i)){var o,n=hr(o=i.substr(4).substr(0,i.length-5).split(",")).call(o,(function(t){return Ko(t)}));i=qr(n[0],n[1],n[2]);}if(!0===Kr(i)){var r=function(t){var e=Wr(t);if(!e)throw new TypeError("'".concat(t,"' is not a valid color."));return Yr(e.r,e.g,e.b)}(i),s={h:r.h,s:.8*r.s,v:Math.min(1,1.02*r.v)},a={h:r.h,s:Math.min(1,1.25*r.s),v:.8*r.v},h=Gr(a.h,a.s,a.v),d=Gr(s.h,s.s,s.v);return {background:i,border:h,highlight:{background:d,border:h},hover:{background:d,border:h}}}return {background:i,border:i,highlight:{background:i,border:i},hover:{background:i,border:i}}}return e?{background:t.background||e.background,border:t.border||e.border,highlight:Pr(t.highlight)?{border:t.highlight,background:t.highlight}:{background:t.highlight&&t.highlight.background||e.highlight.background,border:t.highlight&&t.highlight.border||e.highlight.border},hover:Pr(t.hover)?{border:t.hover,background:t.hover}:{border:t.hover&&t.hover.border||e.hover.border,background:t.hover&&t.hover.background||e.hover.background}}:{background:t.background||void 0,border:t.border||void 0,highlight:Pr(t.highlight)?{border:t.highlight,background:t.highlight}:{background:t.highlight&&t.highlight.background||void 0,border:t.highlight&&t.highlight.border||void 0},hover:Pr(t.hover)?{border:t.hover,background:t.hover}:{border:t.hover&&t.hover.border||void 0,background:t.hover&&t.hover.background||void 0}}}function Yr(t,e,i){t/=255,e/=255,i/=255;var o=Math.min(t,Math.min(e,i)),n=Math.max(t,Math.max(e,i));return o===n?{h:0,s:0,v:o}:{h:60*((t===o?3:i===o?1:5)-(t===o?e-i:i===o?t-e:i-t)/(n-o))/360,s:(n-o)/n,v:n}}function Xr(t,e,i){var o,n,r,s=Math.floor(6*t),a=6*t-s,h=i*(1-e),d=i*(1-a*e),l=i*(1-(1-a)*e);switch(s%6){case 0:o=i,n=l,r=h;break;case 1:o=d,n=i,r=h;break;case 2:o=h,n=i,r=l;break;case 3:o=h,n=d,r=i;break;case 4:o=l,n=h,r=i;break;case 5:o=i,n=h,r=d;}return {r:Math.floor(255*o),g:Math.floor(255*n),b:Math.floor(255*r)}}function Gr(t,e,i){var o=Xr(t,e,i);return qr(o.r,o.g,o.b)}function Kr(t){return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(t)}function $r(t){return Tr.test(t)}function Zr(t){return Mr.test(t)}function Qr(t){if(null===t||"object"!==cr(t))return null;if(t instanceof Element)return t;var e=ko(t);for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&"object"==cr(t[i])&&(e[i]=Qr(t[i]));return e}function Jr(t,e,i){var o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},n=function(t){return null!=t},r=function(t){return null!==t&&"object"===cr(t)},s=function(t){for(var e in t)if(Object.prototype.hasOwnProperty.call(t,e))return !1;return !0};if(!r(t))throw new Error("Parameter mergeTarget must be an object");if(!r(e))throw new Error("Parameter options must be an object");if(!n(i))throw new Error("Parameter option must have a value");if(!r(o))throw new Error("Parameter globalOptions must be an object");var a=function(t,e,i){r(t[i])||(t[i]={});var o=e[i],n=t[i];for(var s in o)Object.prototype.hasOwnProperty.call(o,s)&&(n[s]=o[s]);},h=e[i],d=r(o)&&!s(o),l=d?o[i]:void 0,c=l?l.enabled:void 0;if(void 0!==h){if("boolean"==typeof h)return r(t[i])||(t[i]={}),void(t[i].enabled=h);if(null===h&&!r(t[i])){if(!n(l))return;t[i]=ko(l);}if(r(h)){var u=!0;void 0!==h.enabled?u=h.enabled:void 0!==c&&(u=l.enabled),a(t,e,i),t[i].enabled=u;}}}var ts={linear:function(t){return t},easeInQuad:function(t){return t*t},easeOutQuad:function(t){return t*(2-t)},easeInOutQuad:function(t){return t<.5?2*t*t:(4-2*t)*t-1},easeInCubic:function(t){return t*t*t},easeOutCubic:function(t){return --t*t*t+1},easeInOutCubic:function(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1},easeInQuart:function(t){return t*t*t*t},easeOutQuart:function(t){return 1- --t*t*t*t},easeInOutQuart:function(t){return t<.5?8*t*t*t*t:1-8*--t*t*t*t},easeInQuint:function(t){return t*t*t*t*t},easeOutQuint:function(t){return 1+--t*t*t*t*t},easeInOutQuint:function(t){return t<.5?16*t*t*t*t*t:1+16*--t*t*t*t*t}};function es(t,e){var i;dr(e)||(e=[e]);var o,n=kr(t);try{for(n.s();!(o=n.n()).done;){var r=o.value;if(r){i=r[e[0]];for(var s=1;s<e.length;s++)i&&(i=i[e[s]]);if(void 0!==i)break}}}catch(t){n.e(t);}finally{n.f();}return i}var is=hn("splice"),os=No("splice",{ACCESSORS:!0,0:0,1:2}),ns=Math.max,rs=Math.min,ss=9007199254740991,as="Maximum allowed length exceeded";q({target:"Array",proto:!0,forced:!is||!os},{splice:function(t,e){var i,o,n,r,s,a,h=vt(this),d=ot(h.length),l=st(t,d),c=arguments.length;if(0===c?i=o=0:1===c?(i=0,o=d-l):(i=c-2,o=rs(ns(et(e),0),d-l)),d+i-o>ss)throw TypeError(as);for(n=We(h,o),r=0;r<o;r++)(s=l+r)in h&&Nt(n,r,h[s]);if(n.length=o,i<o){for(r=l;r<d-o;r++)a=r+i,(s=r+o)in h?h[a]=h[s]:delete h[a];for(r=d;r>d-o+i;r--)delete h[r-1];}else if(i>o)for(r=d-o;r>l;r--)a=r+i-1,(s=r+o-1)in h?h[a]=h[s]:delete h[a];for(r=0;r<i;r++)h[r+l]=arguments[r+2];return h.length=d-o+i,n}});var hs=K("Array").splice,ds=Array.prototype,ls=function(t){var e=t.splice;return t===ds||t instanceof Array&&e===ds.splice?hs:e},cs=ht.includes,us=No("indexOf",{ACCESSORS:!0,1:0});q({target:"Array",proto:!0,forced:!us},{includes:function(t){return cs(this,t,arguments.length>1?arguments[1]:void 0)}});var fs=K("Array").includes,ps=pe("match"),vs=function(t){if(function(t){var e;return m(t)&&(void 0!==(e=t[ps])?!!e:"RegExp"==f(t))}(t))throw TypeError("The method doesn't accept regular expressions");return t},gs=pe("match");q({target:"String",proto:!0,forced:!function(t){var e=/./;try{"/./"[t](e);}catch(i){try{return e[gs]=!1,"/./"[t](e)}catch(t){}}return !1}("includes")},{includes:function(t){return !!~String(g(this)).indexOf(vs(t),arguments.length>1?arguments[1]:void 0)}});var ys=K("String").includes,ms=Array.prototype,bs=String.prototype,ws=function(t){var e=t.includes;return t===ms||t instanceof Array&&e===ms.includes?fs:"string"==typeof t||t===bs||t instanceof String&&e===bs.includes?ys:e};function ks(t){return Ms=t,function(){var t={};Ds=0,void(Ps=Ms.charAt(0)),Vs(),"strict"===Is&&(t.strict=!0,Vs());"graph"!==Is&&"digraph"!==Is||(t.type=Is,Vs());zs===Cs&&(t.id=Is,Vs());if("{"!=Is)throw Ks("Angle bracket { expected");if(Vs(),qs(t),"}"!=Is)throw Ks("Angle bracket } expected");if(Vs(),""!==Is)throw Ks("End of file expected");return Vs(),delete t.node,delete t.edge,delete t.graph,t}()}var _s={fontsize:"font.size",fontcolor:"font.color",labelfontcolor:"font.color",fontname:"font.face",color:["color.border","color.background"],fillcolor:"color.background",tooltip:"title",labeltooltip:"title"},xs=ko(_s);xs.color="color.color",xs.style="dashes";var Es=0,Os=1,Cs=2,Ss=3,Ts={"{":!0,"}":!0,"[":!0,"]":!0,";":!0,"=":!0,",":!0,"->":!0,"--":!0},Ms="",Ds=0,Ps="",Is="",zs=Es;function Bs(){Ds++,Ps=Ms.charAt(Ds);}function Fs(){return Ms.charAt(Ds+1)}var Ns=/[a-zA-Z_0-9.:#]/;function As(t){return Ns.test(t)}function Rs(t,e){if(t||(t={}),e)for(var i in e)e.hasOwnProperty(i)&&(t[i]=e[i]);return t}function js(t,e,i){for(var o=e.split("."),n=t;o.length;){var r=o.shift();o.length?(n[r]||(n[r]={}),n=n[r]):n[r]=i;}}function Ls(t,e){for(var i,o,n=null,r=[t],s=t;s.parent;)r.push(s.parent),s=s.parent;if(s.nodes)for(i=0,o=s.nodes.length;i<o;i++)if(e.id===s.nodes[i].id){n=s.nodes[i];break}for(n||(n={id:e.id},t.node&&(n.attr=Rs(n.attr,t.node))),i=r.length-1;i>=0;i--){var a,h=r[i];h.nodes||(h.nodes=[]),-1===On(a=h.nodes).call(a,n)&&h.nodes.push(n);}e.attr&&(n.attr=Rs(n.attr,e.attr));}function Hs(t,e){if(t.edges||(t.edges=[]),t.edges.push(e),t.edge){var i=Rs({},t.edge);e.attr=Rs(i,e.attr);}}function Ws(t,e,i,o,n){var r={from:e,to:i,type:o};return t.edge&&(r.attr=Rs({},t.edge)),r.attr=Rs(r.attr||{},n),null!=n&&n.hasOwnProperty("arrows")&&null!=n.arrows&&(r.arrows={to:{enabled:!0,type:n.arrows.type}},n.arrows=null),r}function Vs(){for(zs=Es,Is="";" "===Ps||"\t"===Ps||"\n"===Ps||"\r"===Ps;)Bs();do{var t=!1;if("#"===Ps){for(var e=Ds-1;" "===Ms.charAt(e)||"\t"===Ms.charAt(e);)e--;if("\n"===Ms.charAt(e)||""===Ms.charAt(e)){for(;""!=Ps&&"\n"!=Ps;)Bs();t=!0;}}if("/"===Ps&&"/"===Fs()){for(;""!=Ps&&"\n"!=Ps;)Bs();t=!0;}if("/"===Ps&&"*"===Fs()){for(;""!=Ps;){if("*"===Ps&&"/"===Fs()){Bs(),Bs();break}Bs();}t=!0;}for(;" "===Ps||"\t"===Ps||"\n"===Ps||"\r"===Ps;)Bs();}while(t);if(""!==Ps){var i=Ps+Fs();if(Ts[i])return zs=Os,Is=i,Bs(),void Bs();if(Ts[Ps])return zs=Os,Is=Ps,void Bs();if(As(Ps)||"-"===Ps){for(Is+=Ps,Bs();As(Ps);)Is+=Ps,Bs();return "false"===Is?Is=!1:"true"===Is?Is=!0:isNaN(Number(Is))||(Is=Number(Is)),void(zs=Cs)}if('"'===Ps){for(Bs();""!=Ps&&('"'!=Ps||'"'===Ps&&'"'===Fs());)'"'===Ps?(Is+=Ps,Bs()):"\\"===Ps&&"n"===Fs()?(Is+="\n",Bs()):Is+=Ps,Bs();if('"'!=Ps)throw Ks('End of string " expected');return Bs(),void(zs=Cs)}for(zs=Ss;""!=Ps;)Is+=Ps,Bs();throw new SyntaxError('Syntax error in part "'+$s(Is,30)+'"')}zs=Os;}function qs(t){for(;""!==Is&&"}"!=Is;)Us(t),";"===Is&&Vs();}function Us(t){var e=Ys(t);if(e)Xs(t,e);else if(!function(t){if("node"===Is)return Vs(),t.node=Gs(),"node";if("edge"===Is)return Vs(),t.edge=Gs(),"edge";if("graph"===Is)return Vs(),t.graph=Gs(),"graph";return null}(t)){if(zs!=Cs)throw Ks("Identifier expected");var i=Is;if(Vs(),"="===Is){if(Vs(),zs!=Cs)throw Ks("Identifier expected");t[i]=Is,Vs();}else !function(t,e){var i={id:e},o=Gs();o&&(i.attr=o);Ls(t,i),Xs(t,e);}(t,i);}}function Ys(t){var e=null;if("subgraph"===Is&&((e={}).type="subgraph",Vs(),zs===Cs&&(e.id=Is,Vs())),"{"===Is){if(Vs(),e||(e={}),e.parent=t,e.node=t.node,e.edge=t.edge,e.graph=t.graph,qs(e),"}"!=Is)throw Ks("Angle bracket } expected");Vs(),delete e.node,delete e.edge,delete e.graph,delete e.parent,t.subgraphs||(t.subgraphs=[]),t.subgraphs.push(e);}return e}function Xs(t,e){for(;"->"===Is||"--"===Is;){var i,o=Is;Vs();var n=Ys(t);if(n)i=n;else {if(zs!=Cs)throw Ks("Identifier or subgraph expected");Ls(t,{id:i=Is}),Vs();}Hs(t,Ws(t,e,i,o,Gs())),e=i;}}function Gs(){for(var t,e,i=null,o={dashed:!0,solid:!1,dotted:[1,5]},n={dot:"circle",box:"box",crow:"crow",curve:"curve",icurve:"inv_curve",normal:"triangle",inv:"inv_triangle",diamond:"diamond",tee:"bar",vee:"vee"},r=new Array,s=new Array;"["===Is;){for(Vs(),i={};""!==Is&&"]"!=Is;){if(zs!=Cs)throw Ks("Attribute name expected");var a=Is;if(Vs(),"="!=Is)throw Ks("Equal sign = expected");if(Vs(),zs!=Cs)throw Ks("Attribute value expected");var h=Is;"style"===a&&(h=o[h]),"arrowhead"===a&&(a="arrows",h={to:{enabled:!0,type:n[h]}}),"arrowtail"===a&&(a="arrows",h={from:{enabled:!0,type:n[h]}}),r.push({attr:i,name:a,value:h}),s.push(a),Vs(),","==Is&&Vs();}if("]"!=Is)throw Ks("Bracket ] expected");Vs();}if(ws(s).call(s,"dir")){var d={arrows:{}};for(t=0;t<r.length;t++)if("arrows"===r[t].name)if(null!=r[t].value.to)d.arrows.to=t;else {if(null==r[t].value.from)throw Ks("Invalid value of arrows");d.arrows.from=t;}else "dir"===r[t].name&&(d.dir=t);var l,c,u=r[d.dir].value;if(!ws(s).call(s,"arrows"))if("both"===u)r.push({attr:r[d.dir].attr,name:"arrows",value:{to:{enabled:!0}}}),d.arrows.to=r.length-1,r.push({attr:r[d.dir].attr,name:"arrows",value:{from:{enabled:!0}}}),d.arrows.from=r.length-1;else if("forward"===u)r.push({attr:r[d.dir].attr,name:"arrows",value:{to:{enabled:!0}}}),d.arrows.to=r.length-1;else if("back"===u)r.push({attr:r[d.dir].attr,name:"arrows",value:{from:{enabled:!0}}}),d.arrows.from=r.length-1;else {if("none"!==u)throw Ks('Invalid dir type "'+u+'"');r.push({attr:r[d.dir].attr,name:"arrows",value:""}),d.arrows.to=r.length-1;}if("both"===u)d.arrows.to&&d.arrows.from?(c=r[d.arrows.to].value.to.type,l=r[d.arrows.from].value.from.type,r[d.arrows.to]={attr:r[d.arrows.to].attr,name:r[d.arrows.to].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}},ls(r).call(r,d.arrows.from,1)):d.arrows.to?(c=r[d.arrows.to].value.to.type,l="arrow",r[d.arrows.to]={attr:r[d.arrows.to].attr,name:r[d.arrows.to].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}}):d.arrows.from&&(c="arrow",l=r[d.arrows.from].value.from.type,r[d.arrows.from]={attr:r[d.arrows.from].attr,name:r[d.arrows.from].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}});else if("back"===u)d.arrows.to&&d.arrows.from?(c="",l=r[d.arrows.from].value.from.type,r[d.arrows.from]={attr:r[d.arrows.from].attr,name:r[d.arrows.from].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}}):d.arrows.to?(c="",l="arrow",d.arrows.from=d.arrows.to,r[d.arrows.from]={attr:r[d.arrows.from].attr,name:r[d.arrows.from].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}}):d.arrows.from&&(c="",l=r[d.arrows.from].value.from.type,r[d.arrows.to]={attr:r[d.arrows.from].attr,name:r[d.arrows.from].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}}),r[d.arrows.from]={attr:r[d.arrows.from].attr,name:r[d.arrows.from].name,value:{from:{enabled:!0,type:r[d.arrows.from].value.from.type}}};else if("none"===u){var f;r[f=d.arrows.to?d.arrows.to:d.arrows.from]={attr:r[f].attr,name:r[f].name,value:""};}else {if("forward"!==u)throw Ks('Invalid dir type "'+u+'"');d.arrows.to&&d.arrows.from||d.arrows.to?(c=r[d.arrows.to].value.to.type,l="",r[d.arrows.to]={attr:r[d.arrows.to].attr,name:r[d.arrows.to].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}}):d.arrows.from&&(c="arrow",l="",d.arrows.to=d.arrows.from,r[d.arrows.to]={attr:r[d.arrows.to].attr,name:r[d.arrows.to].name,value:{to:{enabled:!0,type:c},from:{enabled:!0,type:l}}}),r[d.arrows.to]={attr:r[d.arrows.to].attr,name:r[d.arrows.to].name,value:{to:{enabled:!0,type:r[d.arrows.to].value.to.type}}};}ls(r).call(r,d.dir,1);}if(ws(s).call(s,"penwidth")){var p=[];for(e=r.length,t=0;t<e;t++)"width"!==r[t].name&&("penwidth"===r[t].name&&(r[t].name="width"),p.push(r[t]));r=p;}for(e=r.length,t=0;t<e;t++)js(r[t].attr,r[t].name,r[t].value);return i}function Ks(t){return new SyntaxError(t+', got "'+$s(Is,30)+'" (char '+Ds+")")}function $s(t,e){return t.length<=e?t:t.substr(0,27)+"..."}function Zs(t,e,i){for(var o=e.split("."),n=o.pop(),r=t,s=0;s<o.length;s++){var a=o[s];a in r||(r[a]={}),r=r[a];}return r[n]=i,t}function Qs(t,e){var i={};for(var o in t)if(t.hasOwnProperty(o)){var n=e[o];dr(n)?qo(n).call(n,(function(e){Zs(i,e,t[o]);})):Zs(i,"string"==typeof n?n:o,t[o]);}return i}function Js(t){var e,i=ks(t),o={nodes:[],edges:[],options:{}};i.nodes&&qo(e=i.nodes).call(e,(function(t){var e={id:t.id,label:String(t.label||t.id)};Rs(e,Qs(t.attr,_s)),e.image&&(e.shape="image"),o.nodes.push(e);}));if(i.edges){var n,r=function(t){var e={from:t.from,to:t.to};return Rs(e,Qs(t.attr,xs)),null==e.arrows&&"->"===t.type&&(e.arrows="to"),e};qo(n=i.edges).call(n,(function(t){var e,i,n,s,a,h,d;(e=t.from instanceof Object?t.from.nodes:{id:t.from},i=t.to instanceof Object?t.to.nodes:{id:t.to},t.from instanceof Object&&t.from.edges)&&qo(n=t.from.edges).call(n,(function(t){var e=r(t);o.edges.push(e);}));(a=i,h=function(e,i){var n=Ws(o,e.id,i.id,t.type,t.attr),s=r(n);o.edges.push(s);},dr(s=e)?qo(s).call(s,(function(t){dr(a)?qo(a).call(a,(function(e){h(t,e);})):h(t,a);})):dr(a)?qo(a).call(a,(function(t){h(s,t);})):h(s,a),t.to instanceof Object&&t.to.edges)&&qo(d=t.to.edges).call(d,(function(t){var e=r(t);o.edges.push(e);}));}));}return i.attr&&(o.options=i.attr),o}var ta=Object.freeze({__proto__:null,parseDOT:ks,DOTToGraph:Js});function ea(t,e){var i,o={edges:{inheritColor:!1},nodes:{fixed:!1,parseColor:!1}};null!=e&&(null!=e.fixed&&(o.nodes.fixed=e.fixed),null!=e.parseColor&&(o.nodes.parseColor=e.parseColor),null!=e.inheritColor&&(o.edges.inheritColor=e.inheritColor));var n=t.edges,r=hr(n).call(n,(function(t){var e={from:t.source,id:t.id,to:t.target};return null!=t.attributes&&(e.attributes=t.attributes),null!=t.label&&(e.label=t.label),null!=t.attributes&&null!=t.attributes.title&&(e.title=t.attributes.title),"Directed"===t.type&&(e.arrows="to"),t.color&&!1===o.edges.inheritColor&&(e.color=t.color),e}));return {nodes:hr(i=t.nodes).call(i,(function(t){var e={id:t.id,fixed:o.nodes.fixed&&null!=t.x&&null!=t.y};return null!=t.attributes&&(e.attributes=t.attributes),null!=t.label&&(e.label=t.label),null!=t.size&&(e.size=t.size),null!=t.attributes&&null!=t.attributes.title&&(e.title=t.attributes.title),null!=t.title&&(e.title=t.title),null!=t.x&&(e.x=t.x),null!=t.y&&(e.y=t.y),null!=t.color&&(!0===o.nodes.parseColor?e.color=t.color:e.color={background:t.color,border:t.color,highlight:{background:t.color,border:t.color},hover:{background:t.color,border:t.color}}),e})),edges:r}}var ia=Object.freeze({__proto__:null,parseGephi:ea});function oa(t){var e,i=t&&t.preventDefault||!1,o=t&&t.container||window,n={},r={keydown:{},keyup:{}},s={};for(e=97;e<=122;e++)s[String.fromCharCode(e)]={code:e-97+65,shift:!1};for(e=65;e<=90;e++)s[String.fromCharCode(e)]={code:e,shift:!0};for(e=0;e<=9;e++)s[""+e]={code:48+e,shift:!1};for(e=1;e<=12;e++)s["F"+e]={code:111+e,shift:!1};for(e=0;e<=9;e++)s["num"+e]={code:96+e,shift:!1};s["num*"]={code:106,shift:!1},s["num+"]={code:107,shift:!1},s["num-"]={code:109,shift:!1},s["num/"]={code:111,shift:!1},s["num."]={code:110,shift:!1},s.left={code:37,shift:!1},s.up={code:38,shift:!1},s.right={code:39,shift:!1},s.down={code:40,shift:!1},s.space={code:32,shift:!1},s.enter={code:13,shift:!1},s.shift={code:16,shift:void 0},s.esc={code:27,shift:!1},s.backspace={code:8,shift:!1},s.tab={code:9,shift:!1},s.ctrl={code:17,shift:!1},s.alt={code:18,shift:!1},s.delete={code:46,shift:!1},s.pageup={code:33,shift:!1},s.pagedown={code:34,shift:!1},s["="]={code:187,shift:!1},s["-"]={code:189,shift:!1},s["]"]={code:221,shift:!1},s["["]={code:219,shift:!1};var a=function(t){d(t,"keydown");},h=function(t){d(t,"keyup");},d=function(t,e){if(void 0!==r[e][t.keyCode]){for(var o=r[e][t.keyCode],n=0;n<o.length;n++)(void 0===o[n].shift||1==o[n].shift&&1==t.shiftKey||0==o[n].shift&&0==t.shiftKey)&&o[n].fn(t);1==i&&t.preventDefault();}};return n.bind=function(t,e,i){if(void 0===i&&(i="keydown"),void 0===s[t])throw new Error("unsupported key: "+t);void 0===r[i][s[t].code]&&(r[i][s[t].code]=[]),r[i][s[t].code].push({fn:e,shift:s[t].shift});},n.bindAll=function(t,e){for(var i in void 0===e&&(e="keydown"),s)s.hasOwnProperty(i)&&n.bind(i,t,e);},n.getKey=function(t){for(var e in s)if(s.hasOwnProperty(e)){if(1==t.shiftKey&&1==s[e].shift&&t.keyCode==s[e].code)return e;if(0==t.shiftKey&&0==s[e].shift&&t.keyCode==s[e].code)return e;if(t.keyCode==s[e].code&&"shift"==e)return e}return "unknown key, currently not supported"},n.unbind=function(t,e,i){if(void 0===i&&(i="keydown"),void 0===s[t])throw new Error("unsupported key: "+t);if(void 0!==e){var o=[],n=r[i][s[t].code];if(void 0!==n)for(var a=0;a<n.length;a++)n[a].fn==e&&n[a].shift==s[t].shift||o.push(r[i][s[t].code][a]);r[i][s[t].code]=o;}else r[i][s[t].code]=[];},n.reset=function(){r={keydown:{},keyup:{}};},n.destroy=function(){r={keydown:{},keyup:{}},o.removeEventListener("keydown",a,!0),o.removeEventListener("keyup",h,!0);},o.addEventListener("keydown",a,!0),o.addEventListener("keyup",h,!0),n}
    /*! Hammer.JS - v2.0.17-rc - 2019-12-16
    	 * http://naver.github.io/egjs
    	 *
    	 * Forked By Naver egjs
    	 * Copyright (c) hammerjs
    	 * Licensed under the MIT license */function na(){return (na=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var o in i)Object.prototype.hasOwnProperty.call(i,o)&&(t[o]=i[o]);}return t}).apply(this,arguments)}function ra(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,t.__proto__=e;}function sa(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}var aa,ha="function"!=typeof Object.assign?function(t){if(null==t)throw new TypeError("Cannot convert undefined or null to object");for(var e=Object(t),i=1;i<arguments.length;i++){var o=arguments[i];if(null!=o)for(var n in o)o.hasOwnProperty(n)&&(e[n]=o[n]);}return e}:Object.assign,da=["","webkit","Moz","MS","ms","o"],la="undefined"==typeof document?{style:{}}:document.createElement("div"),ca=Math.round,ua=Math.abs,fa=Date.now;function pa(t,e){for(var i,o,n=e[0].toUpperCase()+e.slice(1),r=0;r<da.length;){if((o=(i=da[r])?i+n:e)in t)return o;r++;}}aa="undefined"==typeof window?{}:window;var va=pa(la.style,"touchAction"),ga=void 0!==va;var ya="compute",ma="auto",ba="manipulation",wa="none",ka="pan-x",_a="pan-y",xa=function(){if(!ga)return !1;var t={},e=aa.CSS&&aa.CSS.supports;return ["auto","manipulation","pan-y","pan-x","pan-x pan-y","none"].forEach((function(i){return t[i]=!e||aa.CSS.supports("touch-action",i)})),t}(),Ea="ontouchstart"in aa,Oa=void 0!==pa(aa,"PointerEvent"),Ca=Ea&&/mobile|tablet|ip(ad|hone|od)|android/i.test(navigator.userAgent),Sa="touch",Ta="mouse",Ma=16,Da=24,Pa=["x","y"],Ia=["clientX","clientY"];function za(t,e,i){var o;if(t)if(t.forEach)t.forEach(e,i);else if(void 0!==t.length)for(o=0;o<t.length;)e.call(i,t[o],o,t),o++;else for(o in t)t.hasOwnProperty(o)&&e.call(i,t[o],o,t);}function Ba(t,e){return "function"==typeof t?t.apply(e&&e[0]||void 0,e):t}function Fa(t,e){return t.indexOf(e)>-1}var Na=function(){function t(t,e){this.manager=t,this.set(e);}var e=t.prototype;return e.set=function(t){t===ya&&(t=this.compute()),ga&&this.manager.element.style&&xa[t]&&(this.manager.element.style[va]=t),this.actions=t.toLowerCase().trim();},e.update=function(){this.set(this.manager.options.touchAction);},e.compute=function(){var t=[];return za(this.manager.recognizers,(function(e){Ba(e.options.enable,[e])&&(t=t.concat(e.getTouchAction()));})),function(t){if(Fa(t,wa))return wa;var e=Fa(t,ka),i=Fa(t,_a);return e&&i?wa:e||i?e?ka:_a:Fa(t,ba)?ba:ma}(t.join(" "))},e.preventDefaults=function(t){var e=t.srcEvent,i=t.offsetDirection;if(this.manager.session.prevented)e.preventDefault();else {var o=this.actions,n=Fa(o,wa)&&!xa.none,r=Fa(o,_a)&&!xa["pan-y"],s=Fa(o,ka)&&!xa["pan-x"];if(n){var a=1===t.pointers.length,h=t.distance<2,d=t.deltaTime<250;if(a&&h&&d)return}if(!s||!r)return n||r&&6&i||s&&i&Da?this.preventSrc(e):void 0}},e.preventSrc=function(t){this.manager.session.prevented=!0,t.preventDefault();},t}();function Aa(t,e){for(;t;){if(t===e)return !0;t=t.parentNode;}return !1}function Ra(t){var e=t.length;if(1===e)return {x:ca(t[0].clientX),y:ca(t[0].clientY)};for(var i=0,o=0,n=0;n<e;)i+=t[n].clientX,o+=t[n].clientY,n++;return {x:ca(i/e),y:ca(o/e)}}function ja(t){for(var e=[],i=0;i<t.pointers.length;)e[i]={clientX:ca(t.pointers[i].clientX),clientY:ca(t.pointers[i].clientY)},i++;return {timeStamp:fa(),pointers:e,center:Ra(e),deltaX:t.deltaX,deltaY:t.deltaY}}function La(t,e,i){i||(i=Pa);var o=e[i[0]]-t[i[0]],n=e[i[1]]-t[i[1]];return Math.sqrt(o*o+n*n)}function Ha(t,e,i){i||(i=Pa);var o=e[i[0]]-t[i[0]],n=e[i[1]]-t[i[1]];return 180*Math.atan2(n,o)/Math.PI}function Wa(t,e){return t===e?1:ua(t)>=ua(e)?t<0?2:4:e<0?8:Ma}function Va(t,e,i){return {x:e/t||0,y:i/t||0}}function qa(t,e){var i=t.session,o=e.pointers,n=o.length;i.firstInput||(i.firstInput=ja(e)),n>1&&!i.firstMultiple?i.firstMultiple=ja(e):1===n&&(i.firstMultiple=!1);var r=i.firstInput,s=i.firstMultiple,a=s?s.center:r.center,h=e.center=Ra(o);e.timeStamp=fa(),e.deltaTime=e.timeStamp-r.timeStamp,e.angle=Ha(a,h),e.distance=La(a,h),function(t,e){var i=e.center,o=t.offsetDelta||{},n=t.prevDelta||{},r=t.prevInput||{};1!==e.eventType&&4!==r.eventType||(n=t.prevDelta={x:r.deltaX||0,y:r.deltaY||0},o=t.offsetDelta={x:i.x,y:i.y}),e.deltaX=n.x+(i.x-o.x),e.deltaY=n.y+(i.y-o.y);}(i,e),e.offsetDirection=Wa(e.deltaX,e.deltaY);var d,l,c=Va(e.deltaTime,e.deltaX,e.deltaY);e.overallVelocityX=c.x,e.overallVelocityY=c.y,e.overallVelocity=ua(c.x)>ua(c.y)?c.x:c.y,e.scale=s?(d=s.pointers,La((l=o)[0],l[1],Ia)/La(d[0],d[1],Ia)):1,e.rotation=s?function(t,e){return Ha(e[1],e[0],Ia)+Ha(t[1],t[0],Ia)}(s.pointers,o):0,e.maxPointers=i.prevInput?e.pointers.length>i.prevInput.maxPointers?e.pointers.length:i.prevInput.maxPointers:e.pointers.length,function(t,e){var i,o,n,r,s=t.lastInterval||e,a=e.timeStamp-s.timeStamp;if(8!==e.eventType&&(a>25||void 0===s.velocity)){var h=e.deltaX-s.deltaX,d=e.deltaY-s.deltaY,l=Va(a,h,d);o=l.x,n=l.y,i=ua(l.x)>ua(l.y)?l.x:l.y,r=Wa(h,d),t.lastInterval=e;}else i=s.velocity,o=s.velocityX,n=s.velocityY,r=s.direction;e.velocity=i,e.velocityX=o,e.velocityY=n,e.direction=r;}(i,e);var u,f=t.element,p=e.srcEvent;Aa(u=p.composedPath?p.composedPath()[0]:p.path?p.path[0]:p.target,f)&&(f=u),e.target=f;}function Ua(t,e,i){var o=i.pointers.length,n=i.changedPointers.length,r=1&e&&o-n==0,s=12&e&&o-n==0;i.isFirst=!!r,i.isFinal=!!s,r&&(t.session={}),i.eventType=e,qa(t,i),t.emit("hammer.input",i),t.recognize(i),t.session.prevInput=i;}function Ya(t){return t.trim().split(/\s+/g)}function Xa(t,e,i){za(Ya(e),(function(e){t.addEventListener(e,i,!1);}));}function Ga(t,e,i){za(Ya(e),(function(e){t.removeEventListener(e,i,!1);}));}function Ka(t){var e=t.ownerDocument||t;return e.defaultView||e.parentWindow||window}var $a=function(){function t(t,e){var i=this;this.manager=t,this.callback=e,this.element=t.element,this.target=t.options.inputTarget,this.domHandler=function(e){Ba(t.options.enable,[t])&&i.handler(e);},this.init();}var e=t.prototype;return e.handler=function(){},e.init=function(){this.evEl&&Xa(this.element,this.evEl,this.domHandler),this.evTarget&&Xa(this.target,this.evTarget,this.domHandler),this.evWin&&Xa(Ka(this.element),this.evWin,this.domHandler);},e.destroy=function(){this.evEl&&Ga(this.element,this.evEl,this.domHandler),this.evTarget&&Ga(this.target,this.evTarget,this.domHandler),this.evWin&&Ga(Ka(this.element),this.evWin,this.domHandler);},t}();function Za(t,e,i){if(t.indexOf&&!i)return t.indexOf(e);for(var o=0;o<t.length;){if(i&&t[o][i]==e||!i&&t[o]===e)return o;o++;}return -1}var Qa={pointerdown:1,pointermove:2,pointerup:4,pointercancel:8,pointerout:8},Ja={2:Sa,3:"pen",4:Ta,5:"kinect"},th="pointerdown",eh="pointermove pointerup pointercancel";aa.MSPointerEvent&&!aa.PointerEvent&&(th="MSPointerDown",eh="MSPointerMove MSPointerUp MSPointerCancel");var ih=function(t){function e(){var i,o=e.prototype;return o.evEl=th,o.evWin=eh,(i=t.apply(this,arguments)||this).store=i.manager.session.pointerEvents=[],i}return ra(e,t),e.prototype.handler=function(t){var e=this.store,i=!1,o=t.type.toLowerCase().replace("ms",""),n=Qa[o],r=Ja[t.pointerType]||t.pointerType,s=r===Sa,a=Za(e,t.pointerId,"pointerId");1&n&&(0===t.button||s)?a<0&&(e.push(t),a=e.length-1):12&n&&(i=!0),a<0||(e[a]=t,this.callback(this.manager,n,{pointers:e,changedPointers:[t],pointerType:r,srcEvent:t}),i&&e.splice(a,1));},e}($a);function oh(t){return Array.prototype.slice.call(t,0)}function nh(t,e,i){for(var o=[],n=[],r=0;r<t.length;){var s=e?t[r][e]:t[r];Za(n,s)<0&&o.push(t[r]),n[r]=s,r++;}return i&&(o=e?o.sort((function(t,i){return t[e]>i[e]})):o.sort()),o}var rh={touchstart:1,touchmove:2,touchend:4,touchcancel:8},sh="touchstart touchmove touchend touchcancel",ah=function(t){function e(){var i;return e.prototype.evTarget=sh,(i=t.apply(this,arguments)||this).targetIds={},i}return ra(e,t),e.prototype.handler=function(t){var e=rh[t.type],i=hh.call(this,t,e);i&&this.callback(this.manager,e,{pointers:i[0],changedPointers:i[1],pointerType:Sa,srcEvent:t});},e}($a);function hh(t,e){var i,o,n=oh(t.touches),r=this.targetIds;if(3&e&&1===n.length)return r[n[0].identifier]=!0,[n,n];var s=oh(t.changedTouches),a=[],h=this.target;if(o=n.filter((function(t){return Aa(t.target,h)})),1===e)for(i=0;i<o.length;)r[o[i].identifier]=!0,i++;for(i=0;i<s.length;)r[s[i].identifier]&&a.push(s[i]),12&e&&delete r[s[i].identifier],i++;return a.length?[nh(o.concat(a),"identifier",!0),a]:void 0}var dh={mousedown:1,mousemove:2,mouseup:4},lh="mousedown",ch="mousemove mouseup",uh=function(t){function e(){var i,o=e.prototype;return o.evEl=lh,o.evWin=ch,(i=t.apply(this,arguments)||this).pressed=!1,i}return ra(e,t),e.prototype.handler=function(t){var e=dh[t.type];1&e&&0===t.button&&(this.pressed=!0),2&e&&1!==t.which&&(e=4),this.pressed&&(4&e&&(this.pressed=!1),this.callback(this.manager,e,{pointers:[t],changedPointers:[t],pointerType:Ta,srcEvent:t}));},e}($a);function fh(t){var e=t.changedPointers[0];if(e.identifier===this.primaryTouch){var i={x:e.clientX,y:e.clientY},o=this.lastTouches;this.lastTouches.push(i);setTimeout((function(){var t=o.indexOf(i);t>-1&&o.splice(t,1);}),2500);}}function ph(t,e){1&t?(this.primaryTouch=e.changedPointers[0].identifier,fh.call(this,e)):12&t&&fh.call(this,e);}function vh(t){for(var e=t.srcEvent.clientX,i=t.srcEvent.clientY,o=0;o<this.lastTouches.length;o++){var n=this.lastTouches[o],r=Math.abs(e-n.x),s=Math.abs(i-n.y);if(r<=25&&s<=25)return !0}return !1}var gh=function(){return function(t){function e(e,i){var o;return (o=t.call(this,e,i)||this).handler=function(t,e,i){var n=i.pointerType===Sa,r=i.pointerType===Ta;if(!(r&&i.sourceCapabilities&&i.sourceCapabilities.firesTouchEvents)){if(n)ph.call(sa(sa(o)),e,i);else if(r&&vh.call(sa(sa(o)),i))return;o.callback(t,e,i);}},o.touch=new ah(o.manager,o.handler),o.mouse=new uh(o.manager,o.handler),o.primaryTouch=null,o.lastTouches=[],o}return ra(e,t),e.prototype.destroy=function(){this.touch.destroy(),this.mouse.destroy();},e}($a)}();function yh(t,e,i){return !!Array.isArray(t)&&(za(t,i[e],i),!0)}var mh=32,bh=1;function wh(t,e){var i=e.manager;return i?i.get(t):t}function kh(t){return 16&t?"cancel":8&t?"end":4&t?"move":2&t?"start":""}var _h=function(){function t(t){void 0===t&&(t={}),this.options=na({enable:!0},t),this.id=bh++,this.manager=null,this.state=1,this.simultaneous={},this.requireFail=[];}var e=t.prototype;return e.set=function(t){return ha(this.options,t),this.manager&&this.manager.touchAction.update(),this},e.recognizeWith=function(t){if(yh(t,"recognizeWith",this))return this;var e=this.simultaneous;return e[(t=wh(t,this)).id]||(e[t.id]=t,t.recognizeWith(this)),this},e.dropRecognizeWith=function(t){return yh(t,"dropRecognizeWith",this)||(t=wh(t,this),delete this.simultaneous[t.id]),this},e.requireFailure=function(t){if(yh(t,"requireFailure",this))return this;var e=this.requireFail;return -1===Za(e,t=wh(t,this))&&(e.push(t),t.requireFailure(this)),this},e.dropRequireFailure=function(t){if(yh(t,"dropRequireFailure",this))return this;t=wh(t,this);var e=Za(this.requireFail,t);return e>-1&&this.requireFail.splice(e,1),this},e.hasRequireFailures=function(){return this.requireFail.length>0},e.canRecognizeWith=function(t){return !!this.simultaneous[t.id]},e.emit=function(t){var e=this,i=this.state;function o(i){e.manager.emit(i,t);}i<8&&o(e.options.event+kh(i)),o(e.options.event),t.additionalEvent&&o(t.additionalEvent),i>=8&&o(e.options.event+kh(i));},e.tryEmit=function(t){if(this.canEmit())return this.emit(t);this.state=mh;},e.canEmit=function(){for(var t=0;t<this.requireFail.length;){if(!(33&this.requireFail[t].state))return !1;t++;}return !0},e.recognize=function(t){var e=ha({},t);if(!Ba(this.options.enable,[this,e]))return this.reset(),void(this.state=mh);56&this.state&&(this.state=1),this.state=this.process(e),30&this.state&&this.tryEmit(e);},e.process=function(t){},e.getTouchAction=function(){},e.reset=function(){},t}(),xh=function(t){function e(e){var i;return void 0===e&&(e={}),(i=t.call(this,na({event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10},e))||this).pTime=!1,i.pCenter=!1,i._timer=null,i._input=null,i.count=0,i}ra(e,t);var i=e.prototype;return i.getTouchAction=function(){return [ba]},i.process=function(t){var e=this,i=this.options,o=t.pointers.length===i.pointers,n=t.distance<i.threshold,r=t.deltaTime<i.time;if(this.reset(),1&t.eventType&&0===this.count)return this.failTimeout();if(n&&r&&o){if(4!==t.eventType)return this.failTimeout();var s=!this.pTime||t.timeStamp-this.pTime<i.interval,a=!this.pCenter||La(this.pCenter,t.center)<i.posThreshold;if(this.pTime=t.timeStamp,this.pCenter=t.center,a&&s?this.count+=1:this.count=1,this._input=t,0===this.count%i.taps)return this.hasRequireFailures()?(this._timer=setTimeout((function(){e.state=8,e.tryEmit();}),i.interval),2):8}return mh},i.failTimeout=function(){var t=this;return this._timer=setTimeout((function(){t.state=mh;}),this.options.interval),mh},i.reset=function(){clearTimeout(this._timer);},i.emit=function(){8===this.state&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input));},e}(_h),Eh=function(t){function e(e){return void 0===e&&(e={}),t.call(this,na({pointers:1},e))||this}ra(e,t);var i=e.prototype;return i.attrTest=function(t){var e=this.options.pointers;return 0===e||t.pointers.length===e},i.process=function(t){var e=this.state,i=t.eventType,o=6&e,n=this.attrTest(t);return o&&(8&i||!n)?16|e:o||n?4&i?8|e:2&e?4|e:2:mh},e}(_h);function Oh(t){return t===Ma?"down":8===t?"up":2===t?"left":4===t?"right":""}var Ch=function(t){function e(e){var i;return void 0===e&&(e={}),(i=t.call(this,na({event:"pan",threshold:10,pointers:1,direction:30},e))||this).pX=null,i.pY=null,i}ra(e,t);var i=e.prototype;return i.getTouchAction=function(){var t=this.options.direction,e=[];return 6&t&&e.push(_a),t&Da&&e.push(ka),e},i.directionTest=function(t){var e=this.options,i=!0,o=t.distance,n=t.direction,r=t.deltaX,s=t.deltaY;return n&e.direction||(6&e.direction?(n=0===r?1:r<0?2:4,i=r!==this.pX,o=Math.abs(t.deltaX)):(n=0===s?1:s<0?8:Ma,i=s!==this.pY,o=Math.abs(t.deltaY))),t.direction=n,i&&o>e.threshold&&n&e.direction},i.attrTest=function(t){return Eh.prototype.attrTest.call(this,t)&&(2&this.state||!(2&this.state)&&this.directionTest(t))},i.emit=function(e){this.pX=e.deltaX,this.pY=e.deltaY;var i=Oh(e.direction);i&&(e.additionalEvent=this.options.event+i),t.prototype.emit.call(this,e);},e}(Eh),Sh=function(t){function e(e){return void 0===e&&(e={}),t.call(this,na({event:"swipe",threshold:10,velocity:.3,direction:30,pointers:1},e))||this}ra(e,t);var i=e.prototype;return i.getTouchAction=function(){return Ch.prototype.getTouchAction.call(this)},i.attrTest=function(e){var i,o=this.options.direction;return 30&o?i=e.overallVelocity:6&o?i=e.overallVelocityX:o&Da&&(i=e.overallVelocityY),t.prototype.attrTest.call(this,e)&&o&e.offsetDirection&&e.distance>this.options.threshold&&e.maxPointers===this.options.pointers&&ua(i)>this.options.velocity&&4&e.eventType},i.emit=function(t){var e=Oh(t.offsetDirection);e&&this.manager.emit(this.options.event+e,t),this.manager.emit(this.options.event,t);},e}(Eh),Th=function(t){function e(e){return void 0===e&&(e={}),t.call(this,na({event:"pinch",threshold:0,pointers:2},e))||this}ra(e,t);var i=e.prototype;return i.getTouchAction=function(){return [wa]},i.attrTest=function(e){return t.prototype.attrTest.call(this,e)&&(Math.abs(e.scale-1)>this.options.threshold||2&this.state)},i.emit=function(e){if(1!==e.scale){var i=e.scale<1?"in":"out";e.additionalEvent=this.options.event+i;}t.prototype.emit.call(this,e);},e}(Eh),Mh=function(t){function e(e){return void 0===e&&(e={}),t.call(this,na({event:"rotate",threshold:0,pointers:2},e))||this}ra(e,t);var i=e.prototype;return i.getTouchAction=function(){return [wa]},i.attrTest=function(e){return t.prototype.attrTest.call(this,e)&&(Math.abs(e.rotation)>this.options.threshold||2&this.state)},e}(Eh),Dh=function(t){function e(e){var i;return void 0===e&&(e={}),(i=t.call(this,na({event:"press",pointers:1,time:251,threshold:9},e))||this)._timer=null,i._input=null,i}ra(e,t);var i=e.prototype;return i.getTouchAction=function(){return [ma]},i.process=function(t){var e=this,i=this.options,o=t.pointers.length===i.pointers,n=t.distance<i.threshold,r=t.deltaTime>i.time;if(this._input=t,!n||!o||12&t.eventType&&!r)this.reset();else if(1&t.eventType)this.reset(),this._timer=setTimeout((function(){e.state=8,e.tryEmit();}),i.time);else if(4&t.eventType)return 8;return mh},i.reset=function(){clearTimeout(this._timer);},i.emit=function(t){8===this.state&&(t&&4&t.eventType?this.manager.emit(this.options.event+"up",t):(this._input.timeStamp=fa(),this.manager.emit(this.options.event,this._input)));},e}(_h),Ph={domEvents:!1,touchAction:ya,enable:!0,inputTarget:null,inputClass:null,cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}},Ih=[[Mh,{enable:!1}],[Th,{enable:!1},["rotate"]],[Sh,{direction:6}],[Ch,{direction:6},["swipe"]],[xh],[xh,{event:"doubletap",taps:2},["tap"]],[Dh]];function zh(t,e){var i,o=t.element;o.style&&(za(t.options.cssProps,(function(n,r){i=pa(o.style,r),e?(t.oldCssProps[i]=o.style[i],o.style[i]=n):o.style[i]=t.oldCssProps[i]||"";})),e||(t.oldCssProps={}));}var Bh=function(){function t(t,e){var i,o=this;this.options=ha({},Ph,e||{}),this.options.inputTarget=this.options.inputTarget||t,this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=t,this.input=new((i=this).options.inputClass||(Oa?ih:Ca?ah:Ea?gh:uh))(i,Ua),this.touchAction=new Na(this,this.options.touchAction),zh(this,!0),za(this.options.recognizers,(function(t){var e=o.add(new t[0](t[1]));t[2]&&e.recognizeWith(t[2]),t[3]&&e.requireFailure(t[3]);}),this);}var e=t.prototype;return e.set=function(t){return ha(this.options,t),t.touchAction&&this.touchAction.update(),t.inputTarget&&(this.input.destroy(),this.input.target=t.inputTarget,this.input.init()),this},e.stop=function(t){this.session.stopped=t?2:1;},e.recognize=function(t){var e=this.session;if(!e.stopped){var i;this.touchAction.preventDefaults(t);var o=this.recognizers,n=e.curRecognizer;(!n||n&&8&n.state)&&(e.curRecognizer=null,n=null);for(var r=0;r<o.length;)i=o[r],2===e.stopped||n&&i!==n&&!i.canRecognizeWith(n)?i.reset():i.recognize(t),!n&&14&i.state&&(e.curRecognizer=i,n=i),r++;}},e.get=function(t){if(t instanceof _h)return t;for(var e=this.recognizers,i=0;i<e.length;i++)if(e[i].options.event===t)return e[i];return null},e.add=function(t){if(yh(t,"add",this))return this;var e=this.get(t.options.event);return e&&this.remove(e),this.recognizers.push(t),t.manager=this,this.touchAction.update(),t},e.remove=function(t){if(yh(t,"remove",this))return this;var e=this.get(t);if(t){var i=this.recognizers,o=Za(i,e);-1!==o&&(i.splice(o,1),this.touchAction.update());}return this},e.on=function(t,e){if(void 0===t||void 0===e)return this;var i=this.handlers;return za(Ya(t),(function(t){i[t]=i[t]||[],i[t].push(e);})),this},e.off=function(t,e){if(void 0===t)return this;var i=this.handlers;return za(Ya(t),(function(t){e?i[t]&&i[t].splice(Za(i[t],e),1):delete i[t];})),this},e.emit=function(t,e){this.options.domEvents&&function(t,e){var i=document.createEvent("Event");i.initEvent(t,!0,!0),i.gesture=e,e.target.dispatchEvent(i);}(t,e);var i=this.handlers[t]&&this.handlers[t].slice();if(i&&i.length){e.type=t,e.preventDefault=function(){e.srcEvent.preventDefault();};for(var o=0;o<i.length;)i[o](e),o++;}},e.destroy=function(){this.element&&zh(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null;},t}(),Fh={touchstart:1,touchmove:2,touchend:4,touchcancel:8},Nh="touchstart",Ah="touchstart touchmove touchend touchcancel",Rh=function(t){function e(){var i,o=e.prototype;return o.evTarget=Nh,o.evWin=Ah,(i=t.apply(this,arguments)||this).started=!1,i}return ra(e,t),e.prototype.handler=function(t){var e=Fh[t.type];if(1===e&&(this.started=!0),this.started){var i=jh.call(this,t,e);12&e&&i[0].length-i[1].length==0&&(this.started=!1),this.callback(this.manager,e,{pointers:i[0],changedPointers:i[1],pointerType:Sa,srcEvent:t});}},e}($a);function jh(t,e){var i=oh(t.touches),o=oh(t.changedTouches);return 12&e&&(i=nh(i.concat(o),"identifier",!0)),[i,o]}function Lh(t,e,i){var o="DEPRECATED METHOD: "+e+"\n"+i+" AT \n";return function(){var e=new Error("get-stack-trace"),i=e&&e.stack?e.stack.replace(/^[^\(]+?[\n$]/gm,"").replace(/^\s+at\s+/gm,"").replace(/^Object.<anonymous>\s*\(/gm,"{anonymous}()@"):"Unknown Stack Trace",n=window.console&&(window.console.warn||window.console.log);return n&&n.call(window.console,o,i),t.apply(this,arguments)}}var Hh=Lh((function(t,e,i){for(var o=Object.keys(e),n=0;n<o.length;)(!i||i&&void 0===t[o[n]])&&(t[o[n]]=e[o[n]]),n++;return t}),"extend","Use `assign`."),Wh=Lh((function(t,e){return Hh(t,e,!0)}),"merge","Use `assign`.");function Vh(t,e,i){var o,n=e.prototype;(o=t.prototype=Object.create(n)).constructor=t,o._super=n,i&&ha(o,i);}function qh(t,e){return function(){return t.apply(e,arguments)}}var Uh=function(){var t=function(t,e){return void 0===e&&(e={}),new Bh(t,na({recognizers:Ih.concat()},e))};return t.VERSION="2.0.17-rc",t.DIRECTION_ALL=30,t.DIRECTION_DOWN=Ma,t.DIRECTION_LEFT=2,t.DIRECTION_RIGHT=4,t.DIRECTION_UP=8,t.DIRECTION_HORIZONTAL=6,t.DIRECTION_VERTICAL=Da,t.DIRECTION_NONE=1,t.DIRECTION_DOWN=Ma,t.INPUT_START=1,t.INPUT_MOVE=2,t.INPUT_END=4,t.INPUT_CANCEL=8,t.STATE_POSSIBLE=1,t.STATE_BEGAN=2,t.STATE_CHANGED=4,t.STATE_ENDED=8,t.STATE_RECOGNIZED=8,t.STATE_CANCELLED=16,t.STATE_FAILED=mh,t.Manager=Bh,t.Input=$a,t.TouchAction=Na,t.TouchInput=ah,t.MouseInput=uh,t.PointerEventInput=ih,t.TouchMouseInput=gh,t.SingleTouchInput=Rh,t.Recognizer=_h,t.AttrRecognizer=Eh,t.Tap=xh,t.Pan=Ch,t.Swipe=Sh,t.Pinch=Th,t.Rotate=Mh,t.Press=Dh,t.on=Xa,t.off=Ga,t.each=za,t.merge=Wh,t.extend=Hh,t.bindFn=qh,t.assign=ha,t.inherit=Vh,t.bindFn=qh,t.prefixed=pa,t.toArray=oh,t.inArray=Za,t.uniqueArray=nh,t.splitStr=Ya,t.boolOrFn=Ba,t.hasParent=Aa,t.addEventListeners=Xa,t.removeEventListeners=Ga,t.defaults=ha({},Ph,{preset:Ih}),t}();var Yh="undefined"!=typeof window?window.Hammer||Uh:function(){return {on:t=function(){},off:t,destroy:t,emit:t,get:function(){return {set:t}}};var t;};function Xh(t){var e,i,o=this;this.active=!1,this.dom={container:t},this.dom.overlay=document.createElement("div"),this.dom.overlay.className="vis-overlay",this.dom.container.appendChild(this.dom.overlay),this.hammer=Yh(this.dom.overlay),this.hammer.on("tap",Q(e=this._onTapOverlay).call(e,this));var n=["tap","doubletap","press","pinch","pan","panstart","panmove","panend"];qo(n).call(n,(function(t){o.hammer.on(t,(function(t){t.srcEvent.stopPropagation();}));})),document&&document.body&&(this.onClick=function(e){(function(t,e){for(;t;){if(t===e)return !0;t=t.parentNode;}return !1})(e.target,t)||o.deactivate();},document.body.addEventListener("click",this.onClick)),void 0!==this.keycharm&&this.keycharm.destroy(),this.keycharm=oa(),this.escListener=Q(i=this.deactivate).call(i,this);}Ct(Xh.prototype),Xh.current=null,Xh.prototype.destroy=function(){this.deactivate(),this.dom.overlay.parentNode.removeChild(this.dom.overlay),this.onClick&&document.body.removeEventListener("click",this.onClick),void 0!==this.keycharm&&this.keycharm.destroy(),this.keycharm=null,this.hammer.destroy(),this.hammer=null;},Xh.prototype.activate=function(){var t,e,i,o,n;Xh.current&&Xh.current.deactivate(),Xh.current=this,this.active=!0,this.dom.overlay.style.display="none",e=this.dom.container,i="vis-active",o=e.className.split(" "),n=i.split(" "),o=br(o).call(o,pn(n).call(n,(function(t){return On(o).call(o,t)<0}))),e.className=o.join(" "),this.emit("change"),this.emit("activate"),Q(t=this.keycharm).call(t,"esc",this.escListener);},Xh.prototype.deactivate=function(){var t,e,i,o;this.active=!1,this.dom.overlay.style.display="block",t=this.dom.container,e="vis-active",i=t.className.split(" "),o=e.split(" "),i=pn(i).call(i,(function(t){return On(o).call(o,t)<0})),t.className=i.join(" "),this.keycharm.unbind("esc",this.escListener),this.emit("change"),this.emit("deactivate");},Xh.prototype._onTapOverlay=function(t){this.activate(),t.srcEvent.stopPropagation();};var Gh=Object.freeze({__proto__:null,en:{addDescription:"Click in an empty space to place a new node.",addEdge:"Add Edge",addNode:"Add Node",back:"Back",createEdgeError:"Cannot link edges to a cluster.",del:"Delete selected",deleteClusterError:"Clusters cannot be deleted.",edgeDescription:"Click on a node and drag the edge to another node to connect them.",edit:"Edit",editClusterError:"Clusters cannot be edited.",editEdge:"Edit Edge",editEdgeDescription:"Click on the control points and drag them to a node to connect to it.",editNode:"Edit Node"},de:{addDescription:"Klicke auf eine freie Stelle, um einen neuen Knoten zu plazieren.",addEdge:"Kante hinzufügen",addNode:"Knoten hinzufügen",back:"Zurück",createEdgeError:"Es ist nicht möglich, Kanten mit Clustern zu verbinden.",del:"Lösche Auswahl",deleteClusterError:"Cluster können nicht gelöscht werden.",edgeDescription:"Klicke auf einen Knoten und ziehe die Kante zu einem anderen Knoten, um diese zu verbinden.",edit:"Editieren",editClusterError:"Cluster können nicht editiert werden.",editEdge:"Kante editieren",editEdgeDescription:"Klicke auf die Verbindungspunkte und ziehe diese auf einen Knoten, um sie zu verbinden.",editNode:"Knoten editieren"},es:{addDescription:"Haga clic en un lugar vacío para colocar un nuevo nodo.",addEdge:"Añadir arista",addNode:"Añadir nodo",back:"Atrás",createEdgeError:"No se puede conectar una arista a un grupo.",del:"Eliminar selección",deleteClusterError:"No es posible eliminar grupos.",edgeDescription:"Haga clic en un nodo y arrastre la arista hacia otro nodo para conectarlos.",edit:"Editar",editClusterError:"No es posible editar grupos.",editEdge:"Editar arista",editEdgeDescription:"Haga clic en un punto de control y arrastrelo a un nodo para conectarlo.",editNode:"Editar nodo"},it:{addDescription:"Clicca per aggiungere un nuovo nodo",addEdge:"Aggiungi un vertice",addNode:"Aggiungi un nodo",back:"Indietro",createEdgeError:"Non si possono collegare vertici ad un cluster",del:"Cancella la selezione",deleteClusterError:"I cluster non possono essere cancellati",edgeDescription:"Clicca su un nodo e trascinalo ad un altro nodo per connetterli.",edit:"Modifica",editClusterError:"I clusters non possono essere modificati.",editEdge:"Modifica il vertice",editEdgeDescription:"Clicca sui Punti di controllo e trascinali ad un nodo per connetterli.",editNode:"Modifica il nodo"},nl:{addDescription:"Klik op een leeg gebied om een nieuwe node te maken.",addEdge:"Link toevoegen",addNode:"Node toevoegen",back:"Terug",createEdgeError:"Kan geen link maken naar een cluster.",del:"Selectie verwijderen",deleteClusterError:"Clusters kunnen niet worden verwijderd.",edgeDescription:"Klik op een node en sleep de link naar een andere node om ze te verbinden.",edit:"Wijzigen",editClusterError:"Clusters kunnen niet worden aangepast.",editEdge:"Link wijzigen",editEdgeDescription:"Klik op de verbindingspunten en sleep ze naar een node om daarmee te verbinden.",editNode:"Node wijzigen"},pt:{addDescription:"Clique em um espaço em branco para adicionar um novo nó",addEdge:"Adicionar aresta",addNode:"Adicionar nó",back:"Voltar",createEdgeError:"Não foi possível linkar arestas a um cluster.",del:"Remover selecionado",deleteClusterError:"Clusters não puderam ser removidos.",edgeDescription:"Clique em um nó e arraste a aresta até outro nó para conectá-los",edit:"Editar",editClusterError:"Clusters não puderam ser editados.",editEdge:"Editar aresta",editEdgeDescription:"Clique nos pontos de controle e os arraste para um nó para conectá-los",editNode:"Editar nó"},ru:{addDescription:"Кликните в свободное место, чтобы добавить новый узел.",addEdge:"Добавить ребро",addNode:"Добавить узел",back:"Назад",createEdgeError:"Невозможно соединить ребра в кластер.",del:"Удалить выбранное",deleteClusterError:"Кластеры не могут быть удалены",edgeDescription:"Кликните на узел и протяните ребро к другому узлу, чтобы соединить их.",edit:"Редактировать",editClusterError:"Кластеры недоступны для редактирования.",editEdge:"Редактировать ребро",editEdgeDescription:"Кликните на контрольные точки и перетащите их в узел, чтобы подключиться к нему.",editNode:"Редактировать узел"},cn:{addDescription:"单击空白处放置新节点。",addEdge:"添加连接线",addNode:"添加节点",back:"返回",createEdgeError:"无法将连接线连接到群集。",del:"删除选定",deleteClusterError:"无法删除群集。",edgeDescription:"单击某个节点并将该连接线拖动到另一个节点以连接它们。",edit:"编辑",editClusterError:"无法编辑群集。",editEdge:"编辑连接线",editEdgeDescription:"单击控制节点并将它们拖到节点上连接。",editNode:"编辑节点"},uk:{addDescription:"Kлікніть на вільне місце, щоб додати новий вузол.",addEdge:"Додати край",addNode:"Додати вузол",back:"Назад",createEdgeError:"Не можливо об'єднати краї в групу.",del:"Видалити обране",deleteClusterError:"Групи не можуть бути видалені.",edgeDescription:"Клікніть на вузол і перетягніть край до іншого вузла, щоб їх з'єднати.",edit:"Редагувати",editClusterError:"Групи недоступні для редагування.",editEdge:"Редагувати край",editEdgeDescription:"Клікніть на контрольні точки і перетягніть їх у вузол, щоб підключитися до нього.",editNode:"Редагувати вузол"},fr:{addDescription:"Cliquez dans un endroit vide pour placer un nœud.",addEdge:"Ajouter un lien",addNode:"Ajouter un nœud",back:"Retour",createEdgeError:"Impossible de créer un lien vers un cluster.",del:"Effacer la sélection",deleteClusterError:"Les clusters ne peuvent pas être effacés.",edgeDescription:"Cliquez sur un nœud et glissez le lien vers un autre nœud pour les connecter.",edit:"Éditer",editClusterError:"Les clusters ne peuvent pas être édités.",editEdge:"Éditer le lien",editEdgeDescription:"Cliquez sur les points de contrôle et glissez-les pour connecter un nœud.",editNode:"Éditer le nœud"},cs:{addDescription:"Kluknutím do prázdného prostoru můžete přidat nový vrchol.",addEdge:"Přidat hranu",addNode:"Přidat vrchol",back:"Zpět",createEdgeError:"Nelze připojit hranu ke shluku.",del:"Smazat výběr",deleteClusterError:"Nelze mazat shluky.",edgeDescription:"Přetažením z jednoho vrcholu do druhého můžete spojit tyto vrcholy novou hranou.",edit:"Upravit",editClusterError:"Nelze upravovat shluky.",editEdge:"Upravit hranu",editEdgeDescription:"Přetažením kontrolního vrcholu hrany ji můžete připojit k jinému vrcholu.",editNode:"Upravit vrchol"}});var Kh=function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")};function $h(t,e){for(var i=0;i<e.length;i++){var o=e[i];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),_o(t,o.key,o);}}var Zh=function(t,e,i){return e&&$h(t.prototype,e),i&&$h(t,i),t},Qh=function(){function t(){Kh(this,t),this.NUM_ITERATIONS=4,this.image=new Image,this.canvas=document.createElement("canvas");}return Zh(t,[{key:"init",value:function(){if(!this.initialized()){this.src=this.image.src;var t=this.image.width,e=this.image.height;this.width=t,this.height=e;var i=Math.floor(e/2),o=Math.floor(e/4),n=Math.floor(e/8),r=Math.floor(e/16),s=Math.floor(t/2),a=Math.floor(t/4),h=Math.floor(t/8),d=Math.floor(t/16);this.canvas.width=3*a,this.canvas.height=i,this.coordinates=[[0,0,s,i],[s,0,a,o],[s,o,h,n],[5*h,o,d,r]],this._fillMipMap();}}},{key:"initialized",value:function(){return void 0!==this.coordinates}},{key:"_fillMipMap",value:function(){var t=this.canvas.getContext("2d"),e=this.coordinates[0];t.drawImage(this.image,e[0],e[1],e[2],e[3]);for(var i=1;i<this.NUM_ITERATIONS;i++){var o=this.coordinates[i-1],n=this.coordinates[i];t.drawImage(this.canvas,o[0],o[1],o[2],o[3],n[0],n[1],n[2],n[3]);}}},{key:"drawImageAtPosition",value:function(t,e,i,o,n,r){if(this.initialized())if(e>2){e*=.5;for(var s=0;e>2&&s<this.NUM_ITERATIONS;)e*=.5,s+=1;s>=this.NUM_ITERATIONS&&(s=this.NUM_ITERATIONS-1);var a=this.coordinates[s];t.drawImage(this.canvas,a[0],a[1],a[2],a[3],i,o,n,r);}else t.drawImage(this.image,i,o,n,r);}}]),t}(),Jh=function(){function t(e){Kh(this,t),this.images={},this.imageBroken={},this.callback=e;}return Zh(t,[{key:"_tryloadBrokenUrl",value:function(t,e,i){void 0!==t&&void 0!==i&&(void 0!==e?(i.image.onerror=function(){console.error("Could not load brokenImage:",e);},i.image.src=e):console.warn("No broken url image defined"));}},{key:"_redrawWithImage",value:function(t){this.callback&&this.callback(t);}},{key:"load",value:function(t,e){var i=this,o=this.images[t];if(o)return o;var n=new Qh;return this.images[t]=n,n.image.onload=function(){i._fixImageCoordinates(n.image),n.init(),i._redrawWithImage(n);},n.image.onerror=function(){console.error("Could not load image:",t),i._tryloadBrokenUrl(t,e,n);},n.image.src=t,n}},{key:"_fixImageCoordinates",value:function(t){0===t.width&&(document.body.appendChild(t),t.width=t.offsetWidth,t.height=t.offsetHeight,document.body.removeChild(t));}}]),t}(),td=!s((function(){return Object.isExtensible(Object.preventExtensions({}))})),ed=o((function(t){var e=L.f,i=Qt("meta"),o=0,n=Object.isExtensible||function(){return !0},r=function(t){e(t,i,{value:{objectID:"O"+ ++o,weakData:{}}});},s=t.exports={REQUIRED:!1,fastKey:function(t,e){if(!m(t))return "symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!k(t,i)){if(!n(t))return "F";if(!e)return "E";r(t);}return t[i].objectID},getWeakData:function(t,e){if(!k(t,i)){if(!n(t))return !0;if(!e)return !1;r(t);}return t[i].weakData},onFreeze:function(t){return td&&s.REQUIRED&&n(t)&&!k(t,i)&&r(t),t}};dt[i]=!0;})),id=function(t,e){this.stopped=t,this.result=e;},od=function(t,e,i){var o,n,r,s,a,h,d,l=i&&i.that,c=!(!i||!i.AS_ENTRIES),u=!(!i||!i.IS_ITERATOR),f=!(!i||!i.INTERRUPTED),p=A(e,l,1+c+f),v=function(t){return o&&so(o),new id(!0,t)},g=function(t){return c?(R(t),f?p(t[0],t[1],v):p(t[0],t[1])):f?p(t,v):p(t)};if(u)o=t;else {if("function"!=typeof(n=oo(t)))throw TypeError("Target is not iterable");if(co(n)){for(r=0,s=ot(t.length);s>r;r++)if((a=g(t[r]))&&a instanceof id)return a;return new id(!1)}o=n.call(t);}for(h=o.next;!(d=h.call(o)).done;){try{a=g(d.value);}catch(t){throw so(o),t}if("object"==typeof a&&a&&a instanceof id)return a}return new id(!1)},nd=function(t,e,i){if(!(t instanceof e))throw TypeError("Incorrect "+(i?i+" ":"")+"invocation");return t},rd=L.f,sd=Ue.forEach,ad=Le.set,hd=Le.getterFor,dd=function(t,e,i){var o,n=-1!==t.indexOf("Map"),h=-1!==t.indexOf("Weak"),d=n?"set":"add",l=r[t],c=l&&l.prototype,u={};if(a&&"function"==typeof l&&(h||c.forEach&&!s((function(){(new l).entries().next();})))){o=e((function(e,i){ad(nd(e,o,t),{type:t,collection:new l}),null!=i&&od(i,e[d],{that:e,AS_ENTRIES:n});}));var f=hd(t);sd(["add","clear","delete","forEach","get","has","set","keys","values","entries"],(function(t){var e="add"==t||"set"==t;!(t in c)||h&&"clear"==t||H(o.prototype,t,(function(i,o){var n=f(this).collection;if(!e&&h&&!m(i))return "get"==t&&void 0;var r=n[t](0===i?0:i,o);return e?this:r}));})),h||rd(o.prototype,"size",{configurable:!0,get:function(){return f(this).collection.size}});}else o=i.getConstructor(e,t,n,d),ed.REQUIRED=!0;return Ce(o,t,!1,!0),u[t]=o,q({global:!0,forced:!0},u),h||i.setStrong(o,t,n),o},ld=function(t,e,i){for(var o in e)i&&i.unsafe&&t[o]?t[o]=e[o]:le(t,o,e[o],i);return t},cd=pe("species"),ud=L.f,fd=ed.fastKey,pd=Le.set,vd=Le.getterFor,gd={getConstructor:function(t,e,i,o){var n=t((function(t,r){nd(t,n,e),pd(t,{type:e,index:re(null),first:void 0,last:void 0,size:0}),a||(t.size=0),null!=r&&od(r,t[o],{that:t,AS_ENTRIES:i});})),r=vd(e),s=function(t,e,i){var o,n,s=r(t),d=h(t,e);return d?d.value=i:(s.last=d={index:n=fd(e,!0),key:e,value:i,previous:o=s.last,next:void 0,removed:!1},s.first||(s.first=d),o&&(o.next=d),a?s.size++:t.size++,"F"!==n&&(s.index[n]=d)),t},h=function(t,e){var i,o=r(t),n=fd(e);if("F"!==n)return o.index[n];for(i=o.first;i;i=i.next)if(i.key==e)return i};return ld(n.prototype,{clear:function(){for(var t=r(this),e=t.index,i=t.first;i;)i.removed=!0,i.previous&&(i.previous=i.previous.next=void 0),delete e[i.index],i=i.next;t.first=t.last=void 0,a?t.size=0:this.size=0;},delete:function(t){var e=this,i=r(e),o=h(e,t);if(o){var n=o.next,s=o.previous;delete i.index[o.index],o.removed=!0,s&&(s.next=n),n&&(n.previous=s),i.first==o&&(i.first=n),i.last==o&&(i.last=s),a?i.size--:e.size--;}return !!o},forEach:function(t){for(var e,i=r(this),o=A(t,arguments.length>1?arguments[1]:void 0,3);e=e?e.next:i.first;)for(o(e.value,e.key,this);e&&e.removed;)e=e.previous;},has:function(t){return !!h(this,t)}}),ld(n.prototype,i?{get:function(t){var e=h(this,t);return e&&e.value},set:function(t,e){return s(this,0===t?0:t,e)}}:{add:function(t){return s(this,t=0===t?0:t,t)}}),a&&ud(n.prototype,"size",{get:function(){return r(this).size}}),n},setStrong:function(t,e,i){var o=e+" Iterator",n=vd(e),r=vd(o);Vi(t,e,(function(t,e){pd(this,{type:o,target:t,state:n(t),kind:e,last:void 0});}),(function(){for(var t=r(this),e=t.kind,i=t.last;i&&i.removed;)i=i.previous;return t.target&&(t.last=i=i?i.next:t.state.first)?"keys"==e?{value:i.key,done:!1}:"values"==e?{value:i.value,done:!1}:{value:[i.key,i.value],done:!1}:(t.target=void 0,{value:void 0,done:!0})}),i?"entries":"values",!i,!0),function(t){var e=It(t),i=L.f;a&&e&&!e[cd]&&i(e,cd,{configurable:!0,get:function(){return this}});}(e);}},yd=(dd("Map",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),gd),F.Map),md=function(){function t(){Kh(this,t),this.clear(),this._defaultIndex=0,this._groupIndex=0,this._defaultGroups=[{border:"#2B7CE9",background:"#97C2FC",highlight:{border:"#2B7CE9",background:"#D2E5FF"},hover:{border:"#2B7CE9",background:"#D2E5FF"}},{border:"#FFA500",background:"#FFFF00",highlight:{border:"#FFA500",background:"#FFFFA3"},hover:{border:"#FFA500",background:"#FFFFA3"}},{border:"#FA0A10",background:"#FB7E81",highlight:{border:"#FA0A10",background:"#FFAFB1"},hover:{border:"#FA0A10",background:"#FFAFB1"}},{border:"#41A906",background:"#7BE141",highlight:{border:"#41A906",background:"#A1EC76"},hover:{border:"#41A906",background:"#A1EC76"}},{border:"#E129F0",background:"#EB7DF4",highlight:{border:"#E129F0",background:"#F0B3F5"},hover:{border:"#E129F0",background:"#F0B3F5"}},{border:"#7C29F0",background:"#AD85E4",highlight:{border:"#7C29F0",background:"#D3BDF0"},hover:{border:"#7C29F0",background:"#D3BDF0"}},{border:"#C37F00",background:"#FFA807",highlight:{border:"#C37F00",background:"#FFCA66"},hover:{border:"#C37F00",background:"#FFCA66"}},{border:"#4220FB",background:"#6E6EFD",highlight:{border:"#4220FB",background:"#9B9BFD"},hover:{border:"#4220FB",background:"#9B9BFD"}},{border:"#FD5A77",background:"#FFC0CB",highlight:{border:"#FD5A77",background:"#FFD1D9"},hover:{border:"#FD5A77",background:"#FFD1D9"}},{border:"#4AD63A",background:"#C2FABC",highlight:{border:"#4AD63A",background:"#E6FFE3"},hover:{border:"#4AD63A",background:"#E6FFE3"}},{border:"#990000",background:"#EE0000",highlight:{border:"#BB0000",background:"#FF3333"},hover:{border:"#BB0000",background:"#FF3333"}},{border:"#FF6000",background:"#FF6000",highlight:{border:"#FF6000",background:"#FF6000"},hover:{border:"#FF6000",background:"#FF6000"}},{border:"#97C2FC",background:"#2B7CE9",highlight:{border:"#D2E5FF",background:"#2B7CE9"},hover:{border:"#D2E5FF",background:"#2B7CE9"}},{border:"#399605",background:"#255C03",highlight:{border:"#399605",background:"#255C03"},hover:{border:"#399605",background:"#255C03"}},{border:"#B70054",background:"#FF007E",highlight:{border:"#B70054",background:"#FF007E"},hover:{border:"#B70054",background:"#FF007E"}},{border:"#AD85E4",background:"#7C29F0",highlight:{border:"#D3BDF0",background:"#7C29F0"},hover:{border:"#D3BDF0",background:"#7C29F0"}},{border:"#4557FA",background:"#000EA1",highlight:{border:"#6E6EFD",background:"#000EA1"},hover:{border:"#6E6EFD",background:"#000EA1"}},{border:"#FFC0CB",background:"#FD5A77",highlight:{border:"#FFD1D9",background:"#FD5A77"},hover:{border:"#FFD1D9",background:"#FD5A77"}},{border:"#C2FABC",background:"#74D66A",highlight:{border:"#E6FFE3",background:"#74D66A"},hover:{border:"#E6FFE3",background:"#74D66A"}},{border:"#EE0000",background:"#990000",highlight:{border:"#FF3333",background:"#BB0000"},hover:{border:"#FF3333",background:"#BB0000"}}],this.options={},this.defaultOptions={useDefaultGroups:!0},bt(this.options,this.defaultOptions);}return Zh(t,[{key:"setOptions",value:function(t){var e=["useDefaultGroups"];if(void 0!==t)for(var i in t)if(Object.prototype.hasOwnProperty.call(t,i)&&-1===On(e).call(e,i)){var o=t[i];this.add(i,o);}}},{key:"clear",value:function(){this._groups=new yd,this._groupNames=[];}},{key:"get",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this._groups.get(t);if(void 0===i&&e)if(!1===this.options.useDefaultGroups&&this._groupNames.length>0){var o=this._groupIndex%this._groupNames.length;++this._groupIndex,(i={}).color=this._groups.get(this._groupNames[o]),this._groups.set(t,i);}else {var n=this._defaultIndex%this._defaultGroups.length;this._defaultIndex++,(i={}).color=this._defaultGroups[n],this._groups.set(t,i);}return i}},{key:"add",value:function(t,e){return this._groups.has(t)||this._groupNames.push(t),this._groups.set(t,e),e}}]),t}(),bd=[].slice,wd=/MSIE .\./.test(en),kd=function(t){return function(e,i){var o=arguments.length>2,n=o?bd.call(arguments,2):void 0;return t(o?function(){("function"==typeof e?e:Function(e)).apply(this,n);}:e,i)}};q({global:!0,bind:!0,forced:wd},{setTimeout:kd(r.setTimeout),setInterval:kd(r.setInterval)});var _d=F.setTimeout,xd=Ue.some,Ed=Io("some"),Od=No("some");q({target:"Array",proto:!0,forced:!Ed||!Od},{some:function(t){return xd(this,t,arguments.length>1?arguments[1]:void 0)}});var Cd=K("Array").some,Sd=Array.prototype,Td=function(t){var e=t.some;return t===Sd||t instanceof Array&&e===Sd.some?Cd:e},Md=r.isFinite,Dd=Number.isFinite||function(t){return "number"==typeof t&&Md(t)};q({target:"Number",stat:!0},{isFinite:Dd});var Pd=F.Number.isFinite;q({target:"Number",stat:!0},{isNaN:function(t){return t!=t}});var Id=F.Number.isNaN,zd=de.f,Bd=s((function(){return !Object.getOwnPropertyNames(1)}));q({target:"Object",stat:!0,forced:Bd},{getOwnPropertyNames:zd});var Fd=F.Object,Nd=function(t){return Fd.getOwnPropertyNames(t)},Ad=Do.trim,Rd=r.parseFloat,jd=1/Rd(Oo+"-0")!=-1/0?function(t){var e=Ad(String(t)),i=Rd(e);return 0===i&&"-"==e.charAt(0)?-0:i}:Rd;q({global:!0,forced:parseFloat!=jd},{parseFloat:jd});var Ld=F.parseFloat;function Hd(t,e){var i=["node","edge","label"],o=!0,n=es(e,"chosen");if("boolean"==typeof n)o=n;else if("object"===cr(n)){if(-1===On(i).call(i,t))throw new Error("choosify: subOption '"+t+"' should be one of '"+i.join("', '")+"'");var r=es(e,["chosen",t]);"boolean"!=typeof r&&"function"!=typeof r||(o=r);}return o}function Wd(t,e,i){if(t.width<=0||t.height<=0)return !1;if(void 0!==i){var o={x:e.x-i.x,y:e.y-i.y};if(0!==i.angle){var n=-i.angle;e={x:Math.cos(n)*o.x-Math.sin(n)*o.y,y:Math.sin(n)*o.x+Math.cos(n)*o.y};}else e=o;}var r=t.x+t.width,s=t.y+t.width;return t.left<e.x&&r>e.x&&t.top<e.y&&s>e.y}function Vd(t){return "string"==typeof t&&""!==t}function qd(t,e,i,o){var n=o.x,r=o.y;if("function"==typeof o.distanceToBorder){var s=o.distanceToBorder(t,e),a=Math.sin(e)*s,h=Math.cos(e)*s;h===s?(n+=s,r=o.y):a===s?(n=o.x,r-=s):(n+=h,r-=a);}else o.shape.width>o.shape.height?(n=o.x+.5*o.shape.width,r=o.y-i):(n=o.x+i,r=o.y-.5*o.shape.height);return {x:n,y:r}}var Ud=K("Array").values,Yd=Array.prototype,Xd={DOMTokenList:!0,NodeList:!0},Gd=function(t){var e=t.values;return t===Yd||t instanceof Array&&e===Yd.values||Xd.hasOwnProperty(_e(t))?Ud:e},Kd=function(){function t(e){Kh(this,t),this.measureText=e,this.current=0,this.width=0,this.height=0,this.lines=[];}return Zh(t,[{key:"_add",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"normal";void 0===this.lines[t]&&(this.lines[t]={width:0,height:0,blocks:[]});var o=e;void 0!==e&&""!==e||(o=" ");var n=this.measureText(o,i),r=bt({},Gd(n));r.text=e,r.width=n.width,r.mod=i,void 0!==e&&""!==e||(r.width=0),this.lines[t].blocks.push(r),this.lines[t].width+=r.width;}},{key:"curWidth",value:function(){var t=this.lines[this.current];return void 0===t?0:t.width}},{key:"append",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"normal";this._add(this.current,t,e);}},{key:"newLine",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"normal";this._add(this.current,t,e),this.current++;}},{key:"determineLineHeights",value:function(){for(var t=0;t<this.lines.length;t++){var e=this.lines[t],i=0;if(void 0!==e.blocks)for(var o=0;o<e.blocks.length;o++){var n=e.blocks[o];i<n.height&&(i=n.height);}e.height=i;}}},{key:"determineLabelSize",value:function(){for(var t=0,e=0,i=0;i<this.lines.length;i++){var o=this.lines[i];o.width>t&&(t=o.width),e+=o.height;}this.width=t,this.height=e;}},{key:"removeEmptyBlocks",value:function(){for(var t=[],e=0;e<this.lines.length;e++){var i=this.lines[e];if(0!==i.blocks.length&&(e!==this.lines.length-1||0!==i.width)){var o={};bt(o,i),o.blocks=[];for(var n=void 0,r=[],s=0;s<i.blocks.length;s++){var a=i.blocks[s];0!==a.width?r.push(a):void 0===n&&(n=a);}0===r.length&&void 0!==n&&r.push(n),o.blocks=r,t.push(o);}}return t}},{key:"finalize",value:function(){this.determineLineHeights(),this.determineLabelSize();var t=this.removeEmptyBlocks();return {width:this.width,height:this.height,lines:t}}}]),t}(),$d={"<b>":/<b>/,"<i>":/<i>/,"<code>":/<code>/,"</b>":/<\/b>/,"</i>":/<\/i>/,"</code>":/<\/code>/,"*":/\*/,_:/_/,"`":/`/,afterBold:/[^*]/,afterItal:/[^_]/,afterMono:/[^`]/},Zd=function(){function t(e){Kh(this,t),this.text=e,this.bold=!1,this.ital=!1,this.mono=!1,this.spacing=!1,this.position=0,this.buffer="",this.modStack=[],this.blocks=[];}return Zh(t,[{key:"mod",value:function(){return 0===this.modStack.length?"normal":this.modStack[0]}},{key:"modName",value:function(){return 0===this.modStack.length?"normal":"mono"===this.modStack[0]?"mono":this.bold&&this.ital?"boldital":this.bold?"bold":this.ital?"ital":void 0}},{key:"emitBlock",value:function(){this.spacing&&(this.add(" "),this.spacing=!1),this.buffer.length>0&&(this.blocks.push({text:this.buffer,mod:this.modName()}),this.buffer="");}},{key:"add",value:function(t){" "===t&&(this.spacing=!0),this.spacing&&(this.buffer+=" ",this.spacing=!1)," "!=t&&(this.buffer+=t);}},{key:"parseWS",value:function(t){return !!/[ \t]/.test(t)&&(this.mono?this.add(t):this.spacing=!0,!0)}},{key:"setTag",value:function(t){this.emitBlock(),this[t]=!0,this.modStack.unshift(t);}},{key:"unsetTag",value:function(t){this.emitBlock(),this[t]=!1,this.modStack.shift();}},{key:"parseStartTag",value:function(t,e){return !(this.mono||this[t]||!this.match(e))&&(this.setTag(t),!0)}},{key:"match",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this.prepareRegExp(t),o=Jn(i,2),n=o[0],r=o[1],s=n.test(this.text.substr(this.position,r));return s&&e&&(this.position+=r-1),s}},{key:"parseEndTag",value:function(t,e,i){var o=this.mod()===t;return !(!(o="mono"===t?o&&this.mono:o&&!this.mono)||!this.match(e))&&(void 0!==i?(this.position===this.text.length-1||this.match(i,!1))&&this.unsetTag(t):this.unsetTag(t),!0)}},{key:"replace",value:function(t,e){return !!this.match(t)&&(this.add(e),this.position+=length-1,!0)}},{key:"prepareRegExp",value:function(t){var e,i;if(t instanceof RegExp)i=t,e=1;else {var o=$d[t];i=void 0!==o?o:new RegExp(t),e=t.length;}return [i,e]}}]),t}(),Qd=function(){function t(e,i,o,n){var r=this;Kh(this,t),this.ctx=e,this.parent=i,this.selected=o,this.hover=n;this.lines=new Kd((function(t,i){if(void 0===t)return 0;var s=r.parent.getFormattingValues(e,o,n,i),a=0;""!==t&&(a=r.ctx.measureText(t).width);return {width:a,values:s}}));}return Zh(t,[{key:"process",value:function(t){if(!Vd(t))return this.lines.finalize();var e=this.parent.fontOptions;t=(t=t.replace(/\r\n/g,"\n")).replace(/\r/g,"\n");var i=String(t).split("\n"),o=i.length;if(e.multi)for(var n=0;n<o;n++){var r=this.splitBlocks(i[n],e.multi);if(void 0!==r)if(0!==r.length){if(e.maxWdt>0)for(var s=0;s<r.length;s++){var a=r[s].mod,h=r[s].text;this.splitStringIntoLines(h,a,!0);}else for(var d=0;d<r.length;d++){var l=r[d].mod,c=r[d].text;this.lines.append(c,l);}this.lines.newLine();}else this.lines.newLine("");}else if(e.maxWdt>0)for(var u=0;u<o;u++)this.splitStringIntoLines(i[u]);else for(var f=0;f<o;f++)this.lines.newLine(i[f]);return this.lines.finalize()}},{key:"decodeMarkupSystem",value:function(t){var e="none";return "markdown"===t||"md"===t?e="markdown":!0!==t&&"html"!==t||(e="html"),e}},{key:"splitHtmlBlocks",value:function(t){for(var e=new Zd(t),i=function(t){return !!/&/.test(t)&&(e.replace(e.text,"&lt;","<")||e.replace(e.text,"&amp;","&")||e.add("&"),!0)};e.position<e.text.length;){var o=e.text.charAt(e.position);e.parseWS(o)||/</.test(o)&&(e.parseStartTag("bold","<b>")||e.parseStartTag("ital","<i>")||e.parseStartTag("mono","<code>")||e.parseEndTag("bold","</b>")||e.parseEndTag("ital","</i>")||e.parseEndTag("mono","</code>"))||i(o)||e.add(o),e.position++;}return e.emitBlock(),e.blocks}},{key:"splitMarkdownBlocks",value:function(t){for(var e=this,i=new Zd(t),o=!0,n=function(t){return !!/\\/.test(t)&&(i.position<e.text.length+1&&(i.position++,t=e.text.charAt(i.position),/ \t/.test(t)?i.spacing=!0:(i.add(t),o=!1)),!0)};i.position<i.text.length;){var r=i.text.charAt(i.position);i.parseWS(r)||n(r)||(o||i.spacing)&&(i.parseStartTag("bold","*")||i.parseStartTag("ital","_")||i.parseStartTag("mono","`"))||i.parseEndTag("bold","*","afterBold")||i.parseEndTag("ital","_","afterItal")||i.parseEndTag("mono","`","afterMono")||(i.add(r),o=!1),i.position++;}return i.emitBlock(),i.blocks}},{key:"splitBlocks",value:function(t,e){var i=this.decodeMarkupSystem(e);return "none"===i?[{text:t,mod:"normal"}]:"markdown"===i?this.splitMarkdownBlocks(t):"html"===i?this.splitHtmlBlocks(t):void 0}},{key:"overMaxWidth",value:function(t){var e=this.ctx.measureText(t).width;return this.lines.curWidth()+e>this.parent.fontOptions.maxWdt}},{key:"getLongestFit",value:function(t){for(var e="",i=0;i<t.length;){var o=e+(""===e?"":" ")+t[i];if(this.overMaxWidth(o))break;e=o,i++;}return i}},{key:"getLongestFitWord",value:function(t){for(var e=0;e<t.length&&!this.overMaxWidth(ur(t).call(t,0,e));)e++;return e}},{key:"splitStringIntoLines",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"normal",i=arguments.length>2&&void 0!==arguments[2]&&arguments[2];this.parent.getFormattingValues(this.ctx,this.selected,this.hover,e);for(var o=(t=(t=t.replace(/^( +)/g,"$1\r")).replace(/([^\r][^ ]*)( +)/g,"$1\r$2\r")).split("\r");o.length>0;){var n=this.getLongestFit(o);if(0===n){var r=o[0],s=this.getLongestFitWord(r);this.lines.newLine(ur(r).call(r,0,s),e),o[0]=ur(r).call(r,s);}else {var a=n;" "===o[n-1]?n--:" "===o[a]&&a++;var h=ur(o).call(o,0,n).join("");n==o.length&&i?this.lines.append(h,e):this.lines.newLine(h,e),o=ur(o).call(o,a);}}}}]),t}(),Jd=["bold","ital","boldital","mono"],tl=function(){function t(e,i){var o=arguments.length>2&&void 0!==arguments[2]&&arguments[2];Kh(this,t),this.body=e,this.pointToSelf=!1,this.baseSize=void 0,this.fontOptions={},this.setOptions(i),this.size={top:0,left:0,width:0,height:0,yLine:0},this.isEdgeLabel=o;}return Zh(t,[{key:"setOptions",value:function(t){if(this.elementOptions=t,this.initFontOptions(t.font),Vd(t.label)?this.labelDirty=!0:t.label=void 0,void 0!==t.font&&null!==t.font)if("string"==typeof t.font)this.baseSize=this.fontOptions.size;else if("object"===cr(t.font)){var e=t.font.size;void 0!==e&&(this.baseSize=e);}}},{key:"initFontOptions",value:function(e){var i=this;Hr(Jd,(function(t){i.fontOptions[t]={};})),t.parseFontString(this.fontOptions,e)?this.fontOptions.vadjust=0:Hr(e,(function(t,e){null!=t&&"object"!==cr(t)&&(i.fontOptions[e]=t);}));}},{key:"constrain",value:function(t){var e={constrainWidth:!1,maxWdt:-1,minWdt:-1,constrainHeight:!1,minHgt:-1,valign:"middle"},i=es(t,"widthConstraint");if("number"==typeof i)e.maxWdt=Number(i),e.minWdt=Number(i);else if("object"===cr(i)){var o=es(t,["widthConstraint","maximum"]);"number"==typeof o&&(e.maxWdt=Number(o));var n=es(t,["widthConstraint","minimum"]);"number"==typeof n&&(e.minWdt=Number(n));}var r=es(t,"heightConstraint");if("number"==typeof r)e.minHgt=Number(r);else if("object"===cr(r)){var s=es(t,["heightConstraint","minimum"]);"number"==typeof s&&(e.minHgt=Number(s));var a=es(t,["heightConstraint","valign"]);"string"==typeof a&&("top"!==a&&"bottom"!==a||(e.valign=a));}return e}},{key:"update",value:function(t,e){this.setOptions(t,!0),this.propagateFonts(e),Ar(this.fontOptions,this.constrain(e)),this.fontOptions.chooser=Hd("label",e);}},{key:"adjustSizes",value:function(t){var e=t?t.right+t.left:0;this.fontOptions.constrainWidth&&(this.fontOptions.maxWdt-=e,this.fontOptions.minWdt-=e);var i=t?t.top+t.bottom:0;this.fontOptions.constrainHeight&&(this.fontOptions.minHgt-=i);}},{key:"addFontOptionsToPile",value:function(t,e){for(var i=0;i<e.length;++i)this.addFontToPile(t,e[i]);}},{key:"addFontToPile",value:function(t,e){if(void 0!==e&&void 0!==e.font&&null!==e.font){var i=e.font;t.push(i);}}},{key:"getBasicOptions",value:function(e){for(var i={},o=0;o<e.length;++o){var n=e[o],r={};t.parseFontString(r,n)&&(n=r),Hr(n,(function(t,e){void 0!==t&&(Object.prototype.hasOwnProperty.call(i,e)||(-1!==On(Jd).call(Jd,e)?i[e]={}:i[e]=t));}));}return i}},{key:"getFontOption",value:function(e,i,o){for(var n,r=0;r<e.length;++r){var s=e[r];if(Object.prototype.hasOwnProperty.call(s,i)){if(null==(n=s[i]))continue;var a={};if(t.parseFontString(a,n)&&(n=a),Object.prototype.hasOwnProperty.call(n,o))return n[o]}}if(Object.prototype.hasOwnProperty.call(this.fontOptions,o))return this.fontOptions[o];throw new Error("Did not find value for multi-font for property: '"+o+"'")}},{key:"getFontOptions",value:function(t,e){for(var i={},o=["color","size","face","mod","vadjust"],n=0;n<o.length;++n){var r=o[n];i[r]=this.getFontOption(t,e,r);}return i}},{key:"propagateFonts",value:function(t){var e=this,i=[];this.addFontOptionsToPile(i,t),this.fontOptions=this.getBasicOptions(i);for(var o=function(t){var o=Jd[t],n=e.fontOptions[o];Hr(e.getFontOptions(i,o),(function(t,e){n[e]=t;})),n.size=Number(n.size),n.vadjust=Number(n.vadjust);},n=0;n<Jd.length;++n)o(n);}},{key:"draw",value:function(t,e,i,o,n){var r=arguments.length>5&&void 0!==arguments[5]?arguments[5]:"middle";if(void 0!==this.elementOptions.label){var s=this.fontOptions.size*this.body.view.scale;this.elementOptions.label&&s<this.elementOptions.scaling.label.drawThreshold-1||(s>=this.elementOptions.scaling.label.maxVisible&&(s=Number(this.elementOptions.scaling.label.maxVisible)/this.body.view.scale),this.calculateLabelSize(t,o,n,e,i,r),this._drawBackground(t),this._drawText(t,e,this.size.yLine,r,s));}}},{key:"_drawBackground",value:function(t){if(void 0!==this.fontOptions.background&&"none"!==this.fontOptions.background){t.fillStyle=this.fontOptions.background;var e=this.getSize();t.fillRect(e.left,e.top,e.width,e.height);}}},{key:"_drawText",value:function(t,e,i){var o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"middle",n=arguments.length>4?arguments[4]:void 0,r=this._setAlignment(t,e,i,o),s=Jn(r,2);e=s[0],i=s[1],t.textAlign="left",e-=this.size.width/2,this.fontOptions.valign&&this.size.height>this.size.labelHeight&&("top"===this.fontOptions.valign&&(i-=(this.size.height-this.size.labelHeight)/2),"bottom"===this.fontOptions.valign&&(i+=(this.size.height-this.size.labelHeight)/2));for(var a=0;a<this.lineCount;a++){var h=this.lines[a];if(h&&h.blocks){var d=0;this.isEdgeLabel||"center"===this.fontOptions.align?d+=(this.size.width-h.width)/2:"right"===this.fontOptions.align&&(d+=this.size.width-h.width);for(var l=0;l<h.blocks.length;l++){var c=h.blocks[l];t.font=c.font;var u=this._getColor(c.color,n,c.strokeColor),f=Jn(u,2),p=f[0],v=f[1];c.strokeWidth>0&&(t.lineWidth=c.strokeWidth,t.strokeStyle=v,t.lineJoin="round"),t.fillStyle=p,c.strokeWidth>0&&t.strokeText(c.text,e+d,i+c.vadjust),t.fillText(c.text,e+d,i+c.vadjust),d+=c.width;}i+=h.height;}}}},{key:"_setAlignment",value:function(t,e,i,o){if(this.isEdgeLabel&&"horizontal"!==this.fontOptions.align&&!1===this.pointToSelf){e=0,i=0;"top"===this.fontOptions.align?(t.textBaseline="alphabetic",i-=4):"bottom"===this.fontOptions.align?(t.textBaseline="hanging",i+=4):t.textBaseline="middle";}else t.textBaseline=o;return [e,i]}},{key:"_getColor",value:function(t,e,i){var o=t||"#000000",n=i||"#ffffff";if(e<=this.elementOptions.scaling.label.drawThreshold){var r=Math.max(0,Math.min(1,1-(this.elementOptions.scaling.label.drawThreshold-e)));o=Vr(o,r),n=Vr(n,r);}return [o,n]}},{key:"getTextSize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return this._processLabel(t,e,i),{width:this.size.width,height:this.size.height,lineCount:this.lineCount}}},{key:"getSize",value:function(){var t=this.size.left,e=this.size.top-1;if(this.isEdgeLabel){var i=.5*-this.size.width;switch(this.fontOptions.align){case"middle":t=i,e=.5*-this.size.height;break;case"top":t=i,e=-(this.size.height+2);break;case"bottom":t=i,e=2;}}return {left:t,top:e,width:this.size.width,height:this.size.height}}},{key:"calculateLabelSize",value:function(t,e,i){var o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:0,n=arguments.length>4&&void 0!==arguments[4]?arguments[4]:0,r=arguments.length>5&&void 0!==arguments[5]?arguments[5]:"middle";this._processLabel(t,e,i),this.size.left=o-.5*this.size.width,this.size.top=n-.5*this.size.height,this.size.yLine=n+.5*(1-this.lineCount)*this.fontOptions.size,"hanging"===r&&(this.size.top+=.5*this.fontOptions.size,this.size.top+=4,this.size.yLine+=4);}},{key:"getFormattingValues",value:function(t,e,i,o){var n=function(t,e,i){return "normal"===e?"mod"===i?"":t[i]:void 0!==t[e][i]?t[e][i]:t[i]},r={color:n(this.fontOptions,o,"color"),size:n(this.fontOptions,o,"size"),face:n(this.fontOptions,o,"face"),mod:n(this.fontOptions,o,"mod"),vadjust:n(this.fontOptions,o,"vadjust"),strokeWidth:this.fontOptions.strokeWidth,strokeColor:this.fontOptions.strokeColor};(e||i)&&("normal"===o&&!0===this.fontOptions.chooser&&this.elementOptions.labelHighlightBold?r.mod="bold":"function"==typeof this.fontOptions.chooser&&this.fontOptions.chooser(r,this.elementOptions.id,e,i));var s="";return void 0!==r.mod&&""!==r.mod&&(s+=r.mod+" "),s+=r.size+"px "+r.face,t.font=s.replace(/"/g,""),r.font=t.font,r.height=r.size,r}},{key:"differentState",value:function(t,e){return t!==this.selectedState||e!==this.hoverState}},{key:"_processLabelText",value:function(t,e,i,o){return new Qd(t,this,e,i).process(o)}},{key:"_processLabel",value:function(t,e,i){if(!1!==this.labelDirty||this.differentState(e,i)){var o=this._processLabelText(t,e,i,this.elementOptions.label);this.fontOptions.minWdt>0&&o.width<this.fontOptions.minWdt&&(o.width=this.fontOptions.minWdt),this.size.labelHeight=o.height,this.fontOptions.minHgt>0&&o.height<this.fontOptions.minHgt&&(o.height=this.fontOptions.minHgt),this.lines=o.lines,this.lineCount=o.lines.length,this.size.width=o.width,this.size.height=o.height,this.selectedState=e,this.hoverState=i,this.labelDirty=!1;}}},{key:"visible",value:function(){return 0!==this.size.width&&0!==this.size.height&&void 0!==this.elementOptions.label&&!(this.fontOptions.size*this.body.view.scale<this.elementOptions.scaling.label.drawThreshold-1)}}],[{key:"parseFontString",value:function(t,e){if(!e||"string"!=typeof e)return !1;var i=e.split(" ");return t.size=+i[0].replace("px",""),t.face=i[1],t.color=i[2],!0}}]),t}(),el=It("Reflect","construct"),il=s((function(){function t(){}return !(el((function(){}),[],t)instanceof t)})),ol=!s((function(){el((function(){}));})),nl=il||ol;q({target:"Reflect",stat:!0,forced:nl,sham:nl},{construct:function(t,e){N(t),R(e);var i=arguments.length<3?t:N(arguments[2]);if(ol&&!il)return el(t,e,i);if(t==i){switch(e.length){case 0:return new t;case 1:return new t(e[0]);case 2:return new t(e[0],e[1]);case 3:return new t(e[0],e[1],e[2]);case 4:return new t(e[0],e[1],e[2],e[3])}var o=[null];return o.push.apply(o,e),new(G.apply(t,o))}var n=i.prototype,r=re(m(n)?n:Object.prototype),s=Function.apply.call(t,r,e);return m(s)?s:r}});var rl=F.Reflect.construct,sl=wo;q({target:"Object",stat:!0},{setPrototypeOf:Fi});var al=F.Object.setPrototypeOf,hl=o((function(t){function e(i,o){return t.exports=e=al||function(t,e){return t.__proto__=e,t},e(i,o)}t.exports=e;}));var dl=function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=sl(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&hl(t,e);};var ll=function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t};var cl=function(t,e){return !e||"object"!==cr(e)&&"function"!=typeof e?ll(t):e},ul=gn,fl=o((function(t){function e(i){return t.exports=e=al?ul:function(t){return t.__proto__||ul(t)},e(i)}t.exports=e;}));q({target:"Array",proto:!0},{fill:function(t){for(var e=vt(this),i=ot(e.length),o=arguments.length,n=st(o>1?arguments[1]:void 0,i),r=o>2?arguments[2]:void 0,s=void 0===r?i:st(r,i);s>n;)e[n++]=t;return e}});var pl=K("Array").fill,vl=Array.prototype,gl=function(t){var e=t.fill;return t===vl||t instanceof Array&&e===vl.fill?pl:e},yl=function(){function t(e,i,o){Kh(this,t),this.body=i,this.labelModule=o,this.setOptions(e),this.top=void 0,this.left=void 0,this.height=void 0,this.width=void 0,this.radius=void 0,this.margin=void 0,this.refreshNeeded=!0,this.boundingBox={top:0,left:0,right:0,bottom:0};}return Zh(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"_setMargins",value:function(t){this.margin={},this.options.margin&&("object"==cr(this.options.margin)?(this.margin.top=this.options.margin.top,this.margin.right=this.options.margin.right,this.margin.bottom=this.options.margin.bottom,this.margin.left=this.options.margin.left):(this.margin.top=this.options.margin,this.margin.right=this.options.margin,this.margin.bottom=this.options.margin,this.margin.left=this.options.margin)),t.adjustSizes(this.margin);}},{key:"_distanceToBorder",value:function(t,e){var i=this.options.borderWidth;return t&&this.resize(t),Math.min(Math.abs(this.width/2/Math.cos(e)),Math.abs(this.height/2/Math.sin(e)))+i}},{key:"enableShadow",value:function(t,e){e.shadow&&(t.shadowColor=e.shadowColor,t.shadowBlur=e.shadowSize,t.shadowOffsetX=e.shadowX,t.shadowOffsetY=e.shadowY);}},{key:"disableShadow",value:function(t,e){e.shadow&&(t.shadowColor="rgba(0,0,0,0)",t.shadowBlur=0,t.shadowOffsetX=0,t.shadowOffsetY=0);}},{key:"enableBorderDashes",value:function(t,e){if(!1!==e.borderDashes)if(void 0!==t.setLineDash){var i=e.borderDashes;!0===i&&(i=[5,15]),t.setLineDash(i);}else console.warn("setLineDash is not supported in this browser. The dashed borders cannot be used."),this.options.shapeProperties.borderDashes=!1,e.borderDashes=!1;}},{key:"disableBorderDashes",value:function(t,e){!1!==e.borderDashes&&(void 0!==t.setLineDash?t.setLineDash([0]):(console.warn("setLineDash is not supported in this browser. The dashed borders cannot be used."),this.options.shapeProperties.borderDashes=!1,e.borderDashes=!1));}},{key:"needsRefresh",value:function(t,e){return !0===this.refreshNeeded?(this.refreshNeeded=!1,!0):void 0===this.width||this.labelModule.differentState(t,e)}},{key:"initContextForDraw",value:function(t,e){var i=e.borderWidth/this.body.view.scale;t.lineWidth=Math.min(this.width,i),t.strokeStyle=e.borderColor,t.fillStyle=e.color;}},{key:"performStroke",value:function(t,e){var i=e.borderWidth/this.body.view.scale;t.save(),i>0&&(this.enableBorderDashes(t,e),t.stroke(),this.disableBorderDashes(t,e)),t.restore();}},{key:"performFill",value:function(t,e){t.save(),t.fillStyle=e.color,this.enableShadow(t,e),gl(t).call(t),this.disableShadow(t,e),t.restore(),this.performStroke(t,e);}},{key:"_addBoundingBoxMargin",value:function(t){this.boundingBox.left-=t,this.boundingBox.top-=t,this.boundingBox.bottom+=t,this.boundingBox.right+=t;}},{key:"_updateBoundingBox",value:function(t,e,i,o,n){void 0!==i&&this.resize(i,o,n),this.left=t-this.width/2,this.top=e-this.height/2,this.boundingBox.left=this.left,this.boundingBox.top=this.top,this.boundingBox.bottom=this.top+this.height,this.boundingBox.right=this.left+this.width;}},{key:"updateBoundingBox",value:function(t,e,i,o,n){this._updateBoundingBox(t,e,i,o,n);}},{key:"getDimensionsFromLabel",value:function(t,e,i){this.textSize=this.labelModule.getTextSize(t,e,i);var o=this.textSize.width,n=this.textSize.height;return 0===o&&(o=14,n=14),{width:o,height:n}}}]),t}();function ml(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var bl=function(t){dl(i,t);var e=ml(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n))._setMargins(n),r}return Zh(i,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover;if(this.needsRefresh(e,i)){var o=this.getDimensionsFromLabel(t,e,i);this.width=o.width+this.margin.right+this.margin.left,this.height=o.height+this.margin.top+this.margin.bottom,this.radius=this.width/2;}}},{key:"draw",value:function(t,e,i,o,n,r){this.resize(t,o,n),this.left=e-this.width/2,this.top=i-this.height/2,this.initContextForDraw(t,r),kt(t,this.left,this.top,this.width,this.height,r.borderRadius),this.performFill(t,r),this.updateBoundingBox(e,i,t,o,n),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,this.top+this.textSize.height/2+this.margin.top,o,n);}},{key:"updateBoundingBox",value:function(t,e,i,o,n){this._updateBoundingBox(t,e,i,o,n);var r=this.options.shapeProperties.borderRadius;this._addBoundingBoxMargin(r);}},{key:"distanceToBorder",value:function(t,e){t&&this.resize(t);var i=this.options.borderWidth;return Math.min(Math.abs(this.width/2/Math.cos(e)),Math.abs(this.height/2/Math.sin(e)))+i}}]),i}(yl);function wl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var kl=function(t){dl(i,t);var e=wl(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n)).labelOffset=0,r.selected=!1,r}return Zh(i,[{key:"setOptions",value:function(t,e,i){this.options=t,void 0===e&&void 0===i||this.setImages(e,i);}},{key:"setImages",value:function(t,e){e&&this.selected?(this.imageObj=e,this.imageObjAlt=t):(this.imageObj=t,this.imageObjAlt=e);}},{key:"switchImages",value:function(t){var e=t&&!this.selected||!t&&this.selected;if(this.selected=t,void 0!==this.imageObjAlt&&e){var i=this.imageObj;this.imageObj=this.imageObjAlt,this.imageObjAlt=i;}}},{key:"_getImagePadding",value:function(){var t={top:0,right:0,bottom:0,left:0};if(this.options.imagePadding){var e=this.options.imagePadding;"object"==cr(e)?(t.top=e.top,t.right=e.right,t.bottom=e.bottom,t.left=e.left):(t.top=e,t.right=e,t.bottom=e,t.left=e);}return t}},{key:"_resizeImage",value:function(){var t,e;if(!1===this.options.shapeProperties.useImageSize){var i=1,o=1;this.imageObj.width&&this.imageObj.height&&(this.imageObj.width>this.imageObj.height?i=this.imageObj.width/this.imageObj.height:o=this.imageObj.height/this.imageObj.width),t=2*this.options.size*i,e=2*this.options.size*o;}else {var n=this._getImagePadding();t=this.imageObj.width+n.left+n.right,e=this.imageObj.height+n.top+n.bottom;}this.width=t,this.height=e,this.radius=.5*this.width;}},{key:"_drawRawCircle",value:function(t,e,i,o){this.initContextForDraw(t,o),wt(t,e,i,o.size),this.performFill(t,o);}},{key:"_drawImageAtPosition",value:function(t,e){if(0!=this.imageObj.width){t.globalAlpha=void 0!==e.opacity?e.opacity:1,this.enableShadow(t,e);var i=1;!0===this.options.shapeProperties.interpolation&&(i=this.imageObj.width/this.width/this.body.view.scale);var o=this._getImagePadding(),n=this.left+o.left,r=this.top+o.top,s=this.width-o.left-o.right,a=this.height-o.top-o.bottom;this.imageObj.drawImageAtPosition(t,i,n,r,s,a),this.disableShadow(t,e);}}},{key:"_drawImageLabel",value:function(t,e,i,o,n){var r=0;if(void 0!==this.height){r=.5*this.height;var s=this.labelModule.getTextSize(t,o,n);s.lineCount>=1&&(r+=s.height/2);}var a=i+r;this.options.label&&(this.labelOffset=r),this.labelModule.draw(t,e,a,o,n,"hanging");}}]),i}(yl);function _l(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var xl=function(t){dl(i,t);var e=_l(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n))._setMargins(n),r}return Zh(i,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover;if(this.needsRefresh(e,i)){var o=this.getDimensionsFromLabel(t,e,i),n=Math.max(o.width+this.margin.right+this.margin.left,o.height+this.margin.top+this.margin.bottom);this.options.size=n/2,this.width=n,this.height=n,this.radius=this.width/2;}}},{key:"draw",value:function(t,e,i,o,n,r){this.resize(t,o,n),this.left=e-this.width/2,this.top=i-this.height/2,this._drawRawCircle(t,e,i,r),this.updateBoundingBox(e,i),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,i,o,n);}},{key:"updateBoundingBox",value:function(t,e){this.boundingBox.top=e-this.options.size,this.boundingBox.left=t-this.options.size,this.boundingBox.right=t+this.options.size,this.boundingBox.bottom=e+this.options.size;}},{key:"distanceToBorder",value:function(t){return t&&this.resize(t),.5*this.width}}]),i}(kl);function El(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Ol=function(t){dl(i,t);var e=El(i);function i(t,o,n,r,s){var a;return Kh(this,i),(a=e.call(this,t,o,n)).setImages(r,s),a}return Zh(i,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover,o=void 0===this.imageObj.src||void 0===this.imageObj.width||void 0===this.imageObj.height;if(o){var n=2*this.options.size;return this.width=n,this.height=n,void(this.radius=.5*this.width)}this.needsRefresh(e,i)&&this._resizeImage();}},{key:"draw",value:function(t,e,i,o,n,r){this.switchImages(o),this.resize();var s=e,a=i;"top-left"===this.options.shapeProperties.coordinateOrigin?(this.left=e,this.top=i,s+=this.width/2,a+=this.height/2):(this.left=e-this.width/2,this.top=i-this.height/2),this._drawRawCircle(t,s,a,r),t.save(),t.clip(),this._drawImageAtPosition(t,r),t.restore(),this._drawImageLabel(t,s,a,o,n),this.updateBoundingBox(e,i);}},{key:"updateBoundingBox",value:function(t,e){"top-left"===this.options.shapeProperties.coordinateOrigin?(this.boundingBox.top=e,this.boundingBox.left=t,this.boundingBox.right=t+2*this.options.size,this.boundingBox.bottom=e+2*this.options.size):(this.boundingBox.top=e-this.options.size,this.boundingBox.left=t-this.options.size,this.boundingBox.right=t+this.options.size,this.boundingBox.bottom=e+this.options.size),this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelOffset);}},{key:"distanceToBorder",value:function(t){return t&&this.resize(t),.5*this.width}}]),i}(kl);function Cl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Sl=function(t){dl(i,t);var e=Cl(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover,o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{size:this.options.size};if(this.needsRefresh(e,i)){var n,r;this.labelModule.getTextSize(t,e,i);var s=2*o.size;this.width=null!==(n=this.customSizeWidth)&&void 0!==n?n:s,this.height=null!==(r=this.customSizeHeight)&&void 0!==r?r:s,this.radius=.5*this.width;}}},{key:"_drawShape",value:function(t,e,i,o,n,r,s,a){var h,d=this;return this.resize(t,r,s,a),this.left=o-this.width/2,this.top=n-this.height/2,this.initContextForDraw(t,a),(h=e,Object.prototype.hasOwnProperty.call(Ot,h)?Ot[h]:function(t){for(var e=arguments.length,i=new Array(e>1?e-1:0),o=1;o<e;o++)i[o-1]=arguments[o];CanvasRenderingContext2D.prototype[h].call(t,i);})(t,o,n,a.size),this.performFill(t,a),void 0!==this.options.icon&&void 0!==this.options.icon.code&&(t.font=(r?"bold ":"")+this.height/2+"px "+(this.options.icon.face||"FontAwesome"),t.fillStyle=this.options.icon.color||"black",t.textAlign="center",t.textBaseline="middle",t.fillText(this.options.icon.code,o,n)),{drawExternalLabel:function(){if(void 0!==d.options.label){d.labelModule.calculateLabelSize(t,r,s,o,n,"hanging");var e=n+.5*d.height+.5*d.labelModule.size.height;d.labelModule.draw(t,o,e,r,s,"hanging");}d.updateBoundingBox(o,n);}}}},{key:"updateBoundingBox",value:function(t,e){this.boundingBox.top=e-this.options.size,this.boundingBox.left=t-this.options.size,this.boundingBox.right=t+this.options.size,this.boundingBox.bottom=e+this.options.size,void 0!==this.options.label&&this.labelModule.size.width>0&&(this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelModule.size.height));}}]),i}(yl);function Tl(t,e){var i=ir(t);if(Oi){var o=Oi(t);e&&(o=pn(o).call(o,(function(e){return Wt(t,e).enumerable}))),i.push.apply(i,o);}return i}function Ml(t){for(var e=1;e<arguments.length;e++){var i,o=null!=arguments[e]?arguments[e]:{};if(e%2)qo(i=Tl(Object(o),!0)).call(i,(function(e){Eo(t,e,o[e]);}));else if(At)Dt(t,At(o));else {var n;qo(n=Tl(Object(o))).call(n,(function(e){Tt(t,e,Wt(o,e));}));}}return t}function Dl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Pl=function(t){dl(i,t);var e=Dl(i);function i(t,o,n,r){var s;return Kh(this,i),(s=e.call(this,t,o,n,r)).ctxRenderer=r,s}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){this.resize(t,o,n,r),this.left=e-this.width/2,this.top=i-this.height/2,t.save();var s=this.ctxRenderer({ctx:t,id:this.options.id,x:e,y:i,state:{selected:o,hover:n},style:Ml({},r),label:this.options.label});if(null!=s.drawNode&&s.drawNode(),t.restore(),s.drawExternalLabel){var a=s.drawExternalLabel;s.drawExternalLabel=function(){t.save(),a(),t.restore();};}return s.nodeDimensions&&(this.customSizeWidth=s.nodeDimensions.width,this.customSizeHeight=s.nodeDimensions.height),s}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(Sl);function Il(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var zl=function(t){dl(i,t);var e=Il(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n))._setMargins(n),r}return Zh(i,[{key:"resize",value:function(t,e,i){if(this.needsRefresh(e,i)){var o=this.getDimensionsFromLabel(t,e,i).width+this.margin.right+this.margin.left;this.width=o,this.height=o,this.radius=this.width/2;}}},{key:"draw",value:function(t,e,i,o,n,r){this.resize(t,o,n),this.left=e-this.width/2,this.top=i-this.height/2,this.initContextForDraw(t,r),xt(t,e-this.width/2,i-this.height/2,this.width,this.height),this.performFill(t,r),this.updateBoundingBox(e,i,t,o,n),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,this.top+this.textSize.height/2+this.margin.top,o,n);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(yl);function Bl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Fl=function(t){dl(i,t);var e=Bl(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){return this._drawShape(t,"diamond",4,e,i,o,n,r)}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(Sl);function Nl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Al=function(t){dl(i,t);var e=Nl(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){return this._drawShape(t,"circle",2,e,i,o,n,r)}},{key:"distanceToBorder",value:function(t){return t&&this.resize(t),this.options.size}}]),i}(Sl);function Rl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var jl=function(t){dl(i,t);var e=Rl(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover;if(this.needsRefresh(e,i)){var o=this.getDimensionsFromLabel(t,e,i);this.height=2*o.height,this.width=o.width+o.height,this.radius=.5*this.width;}}},{key:"draw",value:function(t,e,i,o,n,r){this.resize(t,o,n),this.left=e-.5*this.width,this.top=i-.5*this.height,this.initContextForDraw(t,r),_t(t,this.left,this.top,this.width,this.height),this.performFill(t,r),this.updateBoundingBox(e,i,t,o,n),this.labelModule.draw(t,e,i,o,n);}},{key:"distanceToBorder",value:function(t,e){t&&this.resize(t);var i=.5*this.width,o=.5*this.height,n=Math.sin(e)*i,r=Math.cos(e)*o;return i*o/Math.sqrt(n*n+r*r)}}]),i}(yl);function Ll(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Hl=function(t){dl(i,t);var e=Ll(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n))._setMargins(n),r}return Zh(i,[{key:"resize",value:function(t,e,i){this.needsRefresh(e,i)&&(this.iconSize={width:Number(this.options.icon.size),height:Number(this.options.icon.size)},this.width=this.iconSize.width+this.margin.right+this.margin.left,this.height=this.iconSize.height+this.margin.top+this.margin.bottom,this.radius=.5*this.width);}},{key:"draw",value:function(t,e,i,o,n,r){var s=this;return this.resize(t,o,n),this.options.icon.size=this.options.icon.size||50,this.left=e-this.width/2,this.top=i-this.height/2,this._icon(t,e,i,o,n,r),{drawExternalLabel:function(){if(void 0!==s.options.label){s.labelModule.draw(t,s.left+s.iconSize.width/2+s.margin.left,i+s.height/2+5,o);}s.updateBoundingBox(e,i);}}}},{key:"updateBoundingBox",value:function(t,e){if(this.boundingBox.top=e-.5*this.options.icon.size,this.boundingBox.left=t-.5*this.options.icon.size,this.boundingBox.right=t+.5*this.options.icon.size,this.boundingBox.bottom=e+.5*this.options.icon.size,void 0!==this.options.label&&this.labelModule.size.width>0){this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelModule.size.height+5);}}},{key:"_icon",value:function(t,e,i,o,n,r){var s=Number(this.options.icon.size);void 0!==this.options.icon.code?(t.font=[null!=this.options.icon.weight?this.options.icon.weight:o?"bold":"",(null!=this.options.icon.weight&&o?5:0)+s+"px",this.options.icon.face].join(" "),t.fillStyle=this.options.icon.color||"black",t.textAlign="center",t.textBaseline="middle",this.enableShadow(t,r),t.fillText(this.options.icon.code,e,i),this.disableShadow(t,r)):console.error("When using the icon shape, you need to define the code in the icon options object. This can be done per node or globally.");}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(yl);function Wl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Vl=function(t){dl(i,t);var e=Wl(i);function i(t,o,n,r,s){var a;return Kh(this,i),(a=e.call(this,t,o,n)).setImages(r,s),a}return Zh(i,[{key:"resize",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.selected,i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.hover,o=void 0===this.imageObj.src||void 0===this.imageObj.width||void 0===this.imageObj.height;if(o){var n=2*this.options.size;return this.width=n,void(this.height=n)}this.needsRefresh(e,i)&&this._resizeImage();}},{key:"draw",value:function(t,e,i,o,n,r){t.save(),this.switchImages(o),this.resize();var s=e,a=i;if("top-left"===this.options.shapeProperties.coordinateOrigin?(this.left=e,this.top=i,s+=this.width/2,a+=this.height/2):(this.left=e-this.width/2,this.top=i-this.height/2),!0===this.options.shapeProperties.useBorderWithImage){var h=this.options.borderWidth,d=this.options.borderWidthSelected||2*this.options.borderWidth,l=(o?d:h)/this.body.view.scale;t.lineWidth=Math.min(this.width,l),t.beginPath();var c=o?this.options.color.highlight.border:n?this.options.color.hover.border:this.options.color.border,u=o?this.options.color.highlight.background:n?this.options.color.hover.background:this.options.color.background;void 0!==r.opacity&&(c=Vr(c,r.opacity),u=Vr(u,r.opacity)),t.strokeStyle=c,t.fillStyle=u,t.rect(this.left-.5*t.lineWidth,this.top-.5*t.lineWidth,this.width+t.lineWidth,this.height+t.lineWidth),gl(t).call(t),this.performStroke(t,r),t.closePath();}this._drawImageAtPosition(t,r),this._drawImageLabel(t,s,a,o,n),this.updateBoundingBox(e,i),t.restore();}},{key:"updateBoundingBox",value:function(t,e){this.resize(),"top-left"===this.options.shapeProperties.coordinateOrigin?(this.left=t,this.top=e):(this.left=t-this.width/2,this.top=e-this.height/2),this.boundingBox.left=this.left,this.boundingBox.top=this.top,this.boundingBox.bottom=this.top+this.height,this.boundingBox.right=this.left+this.width,void 0!==this.options.label&&this.labelModule.size.width>0&&(this.boundingBox.left=Math.min(this.boundingBox.left,this.labelModule.size.left),this.boundingBox.right=Math.max(this.boundingBox.right,this.labelModule.size.left+this.labelModule.size.width),this.boundingBox.bottom=Math.max(this.boundingBox.bottom,this.boundingBox.bottom+this.labelOffset));}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(kl);function ql(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Ul=function(t){dl(i,t);var e=ql(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){return this._drawShape(t,"square",2,e,i,o,n,r)}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(Sl);function Yl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Xl=function(t){dl(i,t);var e=Yl(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){return this._drawShape(t,"hexagon",4,e,i,o,n,r)}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(Sl);function Gl(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Kl=function(t){dl(i,t);var e=Gl(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){return this._drawShape(t,"star",4,e,i,o,n,r)}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(Sl);function $l(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Zl=function(t){dl(i,t);var e=$l(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n))._setMargins(n),r}return Zh(i,[{key:"resize",value:function(t,e,i){this.needsRefresh(e,i)&&(this.textSize=this.labelModule.getTextSize(t,e,i),this.width=this.textSize.width+this.margin.right+this.margin.left,this.height=this.textSize.height+this.margin.top+this.margin.bottom,this.radius=.5*this.width);}},{key:"draw",value:function(t,e,i,o,n,r){this.resize(t,o,n),this.left=e-this.width/2,this.top=i-this.height/2,this.enableShadow(t,r),this.labelModule.draw(t,this.left+this.textSize.width/2+this.margin.left,this.top+this.textSize.height/2+this.margin.top,o,n),this.disableShadow(t,r),this.updateBoundingBox(e,i,t,o,n);}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(yl);function Ql(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Jl=function(t){dl(i,t);var e=Ql(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){return this._drawShape(t,"triangle",3,e,i,o,n,r)}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(Sl);function tc(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var ec=function(t){dl(i,t);var e=tc(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"draw",value:function(t,e,i,o,n,r){return this._drawShape(t,"triangleDown",3,e,i,o,n,r)}},{key:"distanceToBorder",value:function(t,e){return this._distanceToBorder(t,e)}}]),i}(Sl),ic=It("JSON","stringify"),oc=/[\uD800-\uDFFF]/g,nc=/^[\uD800-\uDBFF]$/,rc=/^[\uDC00-\uDFFF]$/,sc=function(t,e,i){var o=i.charAt(e-1),n=i.charAt(e+1);return nc.test(t)&&!rc.test(n)||rc.test(t)&&!nc.test(o)?"\\u"+t.charCodeAt(0).toString(16):t},ac=s((function(){return '"\\udf06\\ud834"'!==ic("\udf06\ud834")||'"\\udead"'!==ic("\udead")}));ic&&q({target:"JSON",stat:!0,forced:ac},{stringify:function(t,e,i){var o=ic.apply(null,arguments);return "string"==typeof o?o.replace(oc,sc):o}}),F.JSON||(F.JSON={stringify:JSON.stringify});var hc,dc=function(t,e,i){return F.JSON.stringify.apply(null,arguments)},lc=!1,cc="background: #FFeeee; color: #dd0000",uc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"validate",value:function(e,i,o){lc=!1,hc=i;var n=i;return void 0!==o&&(n=i[o]),t.parse(e,n,[]),lc}},{key:"parse",value:function(e,i,o){for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.check(n,e,i,o);}},{key:"check",value:function(e,i,o,n){if(void 0!==o[e]||void 0!==o.__any__){var r=e,s=!0;void 0===o[e]&&void 0!==o.__any__&&(r="__any__",s="object"===t.getType(i[e]));var a=o[r];s&&void 0!==a.__type__&&(a=a.__type__),t.checkFields(e,i,o,r,a,n);}else t.getSuggestion(e,o,n);}},{key:"checkFields",value:function(e,i,o,n,r,s){var a=function(i){console.error("%c"+i+t.printLocation(s,e),cc);},h=t.getType(i[e]),d=r[h];void 0!==d?"array"===t.getType(d)&&-1===On(d).call(d,i[e])?(a('Invalid option detected in "'+e+'". Allowed values are:'+t.print(d)+' not "'+i[e]+'". '),lc=!0):"object"===h&&"__any__"!==n&&(s=Rr(s,e),t.parse(i[e],o[n],s)):void 0===r.any&&(a('Invalid type received for "'+e+'". Expected: '+t.print(ir(r))+". Received ["+h+'] "'+i[e]+'"'),lc=!0);}},{key:"getType",value:function(t){var e=cr(t);return "object"===e?null===t?"null":t instanceof Boolean?"boolean":t instanceof Number?"number":t instanceof String?"string":dr(t)?"array":t instanceof Date?"date":void 0!==t.nodeType?"dom":!0===t._isAMomentObject?"moment":"object":"number"===e?"number":"boolean"===e?"boolean":"string"===e?"string":void 0===e?"undefined":e}},{key:"getSuggestion",value:function(e,i,o){var n,r=t.findInOptions(e,i,o,!1),s=t.findInOptions(e,hc,[],!0);n=void 0!==r.indexMatch?" in "+t.printLocation(r.path,e,"")+'Perhaps it was incomplete? Did you mean: "'+r.indexMatch+'"?\n\n':s.distance<=4&&r.distance>s.distance?" in "+t.printLocation(r.path,e,"")+"Perhaps it was misplaced? Matching option found at: "+t.printLocation(s.path,s.closestMatch,""):r.distance<=8?'. Did you mean "'+r.closestMatch+'"?'+t.printLocation(r.path,e):". Did you mean one of these: "+t.print(ir(i))+t.printLocation(o,e),console.error('%cUnknown option detected: "'+e+'"'+n,cc),lc=!0;}},{key:"findInOptions",value:function(e,i,o){var n=arguments.length>3&&void 0!==arguments[3]&&arguments[3],r=1e9,s="",a=[],h=e.toLowerCase(),d=void 0;for(var l in i){var c=void 0;if(void 0!==i[l].__type__&&!0===n){var u=t.findInOptions(e,i[l],Rr(o,l));r>u.distance&&(s=u.closestMatch,a=u.path,r=u.distance,d=u.indexMatch);}else {var f;-1!==On(f=l.toLowerCase()).call(f,h)&&(d=l),r>(c=t.levenshteinDistance(e,l))&&(s=l,a=jr(o),r=c);}}return {closestMatch:s,path:a,distance:r,indexMatch:d}}},{key:"printLocation",value:function(t,e){for(var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"Problem value found at: \n",o="\n\n"+i+"options = {\n",n=0;n<t.length;n++){for(var r=0;r<n+1;r++)o+="  ";o+=t[n]+": {\n";}for(var s=0;s<t.length+1;s++)o+="  ";o+=e+"\n";for(var a=0;a<t.length+1;a++){for(var h=0;h<t.length-a;h++)o+="  ";o+="}\n";}return o+"\n\n"}},{key:"print",value:function(t){return dc(t).replace(/(")|(\[)|(\])|(,"__type__")/g,"").replace(/(,)/g,", ")}},{key:"levenshteinDistance",value:function(t,e){if(0===t.length)return e.length;if(0===e.length)return t.length;var i,o,n=[];for(i=0;i<=e.length;i++)n[i]=[i];for(o=0;o<=t.length;o++)n[0][o]=o;for(i=1;i<=e.length;i++)for(o=1;o<=t.length;o++)e.charAt(i-1)==t.charAt(o-1)?n[i][o]=n[i-1][o-1]:n[i][o]=Math.min(n[i-1][o-1]+1,Math.min(n[i][o-1]+1,n[i-1][o]+1));return n[e.length][t.length]}}]),t}();function fc(t,e){var i=ir(t);if(Oi){var o=Oi(t);e&&(o=pn(o).call(o,(function(e){return Wt(t,e).enumerable}))),i.push.apply(i,o);}return i}function pc(t){for(var e=1;e<arguments.length;e++){var i,o=null!=arguments[e]?arguments[e]:{};if(e%2)qo(i=fc(Object(o),!0)).call(i,(function(e){Eo(t,e,o[e]);}));else if(At)Dt(t,At(o));else {var n;qo(n=fc(Object(o))).call(n,(function(e){Tt(t,e,Wt(o,e));}));}}return t}var vc=function(){function t(e,i,o,n,r,s){Kh(this,t),this.options=Qr(r),this.globalOptions=r,this.defaultOptions=s,this.body=i,this.edges=[],this.id=void 0,this.imagelist=o,this.grouplist=n,this.x=void 0,this.y=void 0,this.baseSize=this.options.size,this.baseFontSize=this.options.font.size,this.predefinedPosition=!1,this.selected=!1,this.hover=!1,this.labelModule=new tl(this.body,this.options,!1),this.setOptions(e);}return Zh(t,[{key:"attachEdge",value:function(t){var e;-1===On(e=this.edges).call(e,t)&&this.edges.push(t);}},{key:"detachEdge",value:function(t){var e,i,o=On(e=this.edges).call(e,t);-1!=o&&ls(i=this.edges).call(i,o,1);}},{key:"setOptions",value:function(e){var i=this.options.shape;if(e){if(void 0!==e.color&&(this._localColor=e.color),void 0!==e.id&&(this.id=e.id),void 0===this.id)throw new Error("Node must have an id");t.checkMass(e,this.id),void 0!==e.x&&(null===e.x?(this.x=void 0,this.predefinedPosition=!1):(this.x=Ko(e.x),this.predefinedPosition=!0)),void 0!==e.y&&(null===e.y?(this.y=void 0,this.predefinedPosition=!1):(this.y=Ko(e.y),this.predefinedPosition=!0)),void 0!==e.size&&(this.baseSize=e.size),void 0!==e.value&&(e.value=Ld(e.value)),t.parseOptions(this.options,e,!0,this.globalOptions,this.grouplist);var o=[e,this.options,this.defaultOptions];return this.chooser=Hd("node",o),this._load_images(),this.updateLabelModule(e),void 0!==e.opacity&&t.checkOpacity(e.opacity)&&(this.options.opacity=e.opacity),this.updateShape(i),void 0!==e.hidden||void 0!==e.physics}}},{key:"_load_images",value:function(){if(("circularImage"===this.options.shape||"image"===this.options.shape)&&void 0===this.options.image)throw new Error("Option image must be defined for node type '"+this.options.shape+"'");if(void 0!==this.options.image){if(void 0===this.imagelist)throw new Error("Internal Error: No images provided");if("string"==typeof this.options.image)this.imageObj=this.imagelist.load(this.options.image,this.options.brokenImage,this.id);else {if(void 0===this.options.image.unselected)throw new Error("No unselected image provided");this.imageObj=this.imagelist.load(this.options.image.unselected,this.options.brokenImage,this.id),void 0!==this.options.image.selected?this.imageObjAlt=this.imagelist.load(this.options.image.selected,this.options.brokenImage,this.id):this.imageObjAlt=void 0;}}}},{key:"getFormattingValues",value:function(){var t={color:this.options.color.background,opacity:this.options.opacity,borderWidth:this.options.borderWidth,borderColor:this.options.color.border,size:this.options.size,borderDashes:this.options.shapeProperties.borderDashes,borderRadius:this.options.shapeProperties.borderRadius,shadow:this.options.shadow.enabled,shadowColor:this.options.shadow.color,shadowSize:this.options.shadow.size,shadowX:this.options.shadow.x,shadowY:this.options.shadow.y};if(this.selected||this.hover?!0===this.chooser?this.selected?(null!=this.options.borderWidthSelected?t.borderWidth=this.options.borderWidthSelected:t.borderWidth*=2,t.color=this.options.color.highlight.background,t.borderColor=this.options.color.highlight.border,t.shadow=this.options.shadow.enabled):this.hover&&(t.color=this.options.color.hover.background,t.borderColor=this.options.color.hover.border,t.shadow=this.options.shadow.enabled):"function"==typeof this.chooser&&(this.chooser(t,this.options.id,this.selected,this.hover),!1===t.shadow&&(t.shadowColor===this.options.shadow.color&&t.shadowSize===this.options.shadow.size&&t.shadowX===this.options.shadow.x&&t.shadowY===this.options.shadow.y||(t.shadow=!0))):t.shadow=this.options.shadow.enabled,void 0!==this.options.opacity){var e=this.options.opacity;t.borderColor=Vr(t.borderColor,e),t.color=Vr(t.color,e),t.shadowColor=Vr(t.shadowColor,e);}return t}},{key:"updateLabelModule",value:function(e){void 0!==this.options.label&&null!==this.options.label||(this.options.label=""),t.updateGroupOptions(this.options,pc(pc({},e),{},{color:e&&e.color||this._localColor||void 0}),this.grouplist);var i=this.grouplist.get(this.options.group,!1),o=[e,this.options,i,this.globalOptions,this.defaultOptions];this.labelModule.update(this.options,o),void 0!==this.labelModule.baseSize&&(this.baseFontSize=this.labelModule.baseSize);}},{key:"updateShape",value:function(t){if(t===this.options.shape&&this.shape)this.shape.setOptions(this.options,this.imageObj,this.imageObjAlt);else switch(this.options.shape){case"box":this.shape=new bl(this.options,this.body,this.labelModule);break;case"circle":this.shape=new xl(this.options,this.body,this.labelModule);break;case"circularImage":this.shape=new Ol(this.options,this.body,this.labelModule,this.imageObj,this.imageObjAlt);break;case"custom":this.shape=new Pl(this.options,this.body,this.labelModule,this.options.ctxRenderer);break;case"database":this.shape=new zl(this.options,this.body,this.labelModule);break;case"diamond":this.shape=new Fl(this.options,this.body,this.labelModule);break;case"dot":this.shape=new Al(this.options,this.body,this.labelModule);break;case"ellipse":this.shape=new jl(this.options,this.body,this.labelModule);break;case"icon":this.shape=new Hl(this.options,this.body,this.labelModule);break;case"image":this.shape=new Vl(this.options,this.body,this.labelModule,this.imageObj,this.imageObjAlt);break;case"square":this.shape=new Ul(this.options,this.body,this.labelModule);break;case"hexagon":this.shape=new Xl(this.options,this.body,this.labelModule);break;case"star":this.shape=new Kl(this.options,this.body,this.labelModule);break;case"text":this.shape=new Zl(this.options,this.body,this.labelModule);break;case"triangle":this.shape=new Jl(this.options,this.body,this.labelModule);break;case"triangleDown":this.shape=new ec(this.options,this.body,this.labelModule);break;default:this.shape=new jl(this.options,this.body,this.labelModule);}this.needsRefresh();}},{key:"select",value:function(){this.selected=!0,this.needsRefresh();}},{key:"unselect",value:function(){this.selected=!1,this.needsRefresh();}},{key:"needsRefresh",value:function(){this.shape.refreshNeeded=!0;}},{key:"getTitle",value:function(){return this.options.title}},{key:"distanceToBorder",value:function(t,e){return this.shape.distanceToBorder(t,e)}},{key:"isFixed",value:function(){return this.options.fixed.x&&this.options.fixed.y}},{key:"isSelected",value:function(){return this.selected}},{key:"getValue",value:function(){return this.options.value}},{key:"getLabelSize",value:function(){return this.labelModule.size()}},{key:"setValueRange",value:function(t,e,i){if(void 0!==this.options.value){var o=this.options.scaling.customScalingFunction(t,e,i,this.options.value),n=this.options.scaling.max-this.options.scaling.min;if(!0===this.options.scaling.label.enabled){var r=this.options.scaling.label.max-this.options.scaling.label.min;this.options.font.size=this.options.scaling.label.min+o*r;}this.options.size=this.options.scaling.min+o*n;}else this.options.size=this.baseSize,this.options.font.size=this.baseFontSize;this.updateLabelModule();}},{key:"draw",value:function(t){var e=this.getFormattingValues();return this.shape.draw(t,this.x,this.y,this.selected,this.hover,e)||{}}},{key:"updateBoundingBox",value:function(t){this.shape.updateBoundingBox(this.x,this.y,t);}},{key:"resize",value:function(t){var e=this.getFormattingValues();this.shape.resize(t,this.selected,this.hover,e);}},{key:"getItemsOnPoint",value:function(t){var e=[];return this.labelModule.visible()&&Wd(this.labelModule.getSize(),t)&&e.push({nodeId:this.id,labelId:0}),Wd(this.shape.boundingBox,t)&&e.push({nodeId:this.id}),e}},{key:"isOverlappingWith",value:function(t){return this.shape.left<t.right&&this.shape.left+this.shape.width>t.left&&this.shape.top<t.bottom&&this.shape.top+this.shape.height>t.top}},{key:"isBoundingBoxOverlappingWith",value:function(t){return this.shape.boundingBox.left<t.right&&this.shape.boundingBox.right>t.left&&this.shape.boundingBox.top<t.bottom&&this.shape.boundingBox.bottom>t.top}}],[{key:"checkOpacity",value:function(t){return 0<=t&&t<=1}},{key:"checkCoordinateOrigin",value:function(t){return void 0===t||"center"===t||"top-left"===t}},{key:"updateGroupOptions",value:function(e,i,o){var n;if(void 0!==o){var r=e.group;if(void 0!==i&&void 0!==i.group&&r!==i.group)throw new Error("updateGroupOptions: group values in options don't match.");if("number"==typeof r||"string"==typeof r&&""!=r){var s=o.get(r);void 0!==s.opacity&&void 0===i.opacity&&(t.checkOpacity(s.opacity)||(console.error("Invalid option for node opacity. Value must be between 0 and 1, found: "+s.opacity),s.opacity=void 0));var a=pn(n=Nd(i)).call(n,(function(t){return null!=i[t]}));a.push("font"),Nr(a,e,s),e.color=Ur(e.color);}}}},{key:"parseOptions",value:function(e,i){var o=arguments.length>2&&void 0!==arguments[2]&&arguments[2],n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},r=arguments.length>4?arguments[4]:void 0,s=["color","fixed","shadow"];if(Nr(s,e,i,o),t.checkMass(i),void 0!==e.opacity&&(t.checkOpacity(e.opacity)||(console.error("Invalid option for node opacity. Value must be between 0 and 1, found: "+e.opacity),e.opacity=void 0)),void 0!==i.opacity&&(t.checkOpacity(i.opacity)||(console.error("Invalid option for node opacity. Value must be between 0 and 1, found: "+i.opacity),i.opacity=void 0)),i.shapeProperties&&!t.checkCoordinateOrigin(i.shapeProperties.coordinateOrigin)&&console.error("Invalid option for node coordinateOrigin, found: "+i.shapeProperties.coordinateOrigin),Jr(e,i,"shadow",n),void 0!==i.color&&null!==i.color){var a=Ur(i.color);Br(e.color,a);}else !0===o&&null===i.color&&(e.color=Qr(n.color));void 0!==i.fixed&&null!==i.fixed&&("boolean"==typeof i.fixed?(e.fixed.x=i.fixed,e.fixed.y=i.fixed):(void 0!==i.fixed.x&&"boolean"==typeof i.fixed.x&&(e.fixed.x=i.fixed.x),void 0!==i.fixed.y&&"boolean"==typeof i.fixed.y&&(e.fixed.y=i.fixed.y))),!0===o&&null===i.font&&(e.font=Qr(n.font)),t.updateGroupOptions(e,i,r),void 0!==i.scaling&&Jr(e.scaling,i.scaling,"label",n.scaling);}},{key:"checkMass",value:function(t,e){if(void 0!==t.mass&&t.mass<=0){var i="";void 0!==e&&(i=" in node id: "+e),console.error("%cNegative or zero mass disallowed"+i+", setting mass to 1.",cc),t.mass=1;}}}]),t}();function gc(t,e){var i;if(void 0===wr||null==ro(t)){if(dr(t)||(i=function(t,e){var i;if(!t)return;if("string"==typeof t)return yc(t,e);var o=ur(i=Object.prototype.toString.call(t)).call(i,8,-1);"Object"===o&&t.constructor&&(o=t.constructor.name);if("Map"===o||"Set"===o)return mo(t);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return yc(t,e)}(t))||e&&t&&"number"==typeof t.length){i&&(t=i);var o=0,n=function(){};return {s:n,n:function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}},e:function(t){throw t},f:n}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var r,s=!0,a=!1;return {s:function(){i=no(t);},n:function(){var t=i.next();return s=t.done,t},e:function(t){a=!0,r=t;},f:function(){try{s||null==i.return||i.return();}finally{if(a)throw r}}}}function yc(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o}var mc=function(){function t(e,i,o,n){var r,s=this;if(Kh(this,t),this.body=e,this.images=i,this.groups=o,this.layoutEngine=n,this.body.functions.createNode=Q(r=this.create).call(r,this),this.nodesListeners={add:function(t,e){s.add(e.items);},update:function(t,e){s.update(e.items,e.data,e.oldData);},remove:function(t,e){s.remove(e.items);}},this.defaultOptions={borderWidth:1,borderWidthSelected:void 0,brokenImage:void 0,color:{border:"#2B7CE9",background:"#97C2FC",highlight:{border:"#2B7CE9",background:"#D2E5FF"},hover:{border:"#2B7CE9",background:"#D2E5FF"}},opacity:void 0,fixed:{x:!1,y:!1},font:{color:"#343434",size:14,face:"arial",background:"none",strokeWidth:0,strokeColor:"#ffffff",align:"center",vadjust:0,multi:!1,bold:{mod:"bold"},boldital:{mod:"bold italic"},ital:{mod:"italic"},mono:{mod:"",size:15,face:"monospace",vadjust:2}},group:void 0,hidden:!1,icon:{face:"FontAwesome",code:void 0,size:50,color:"#2B7CE9"},image:void 0,imagePadding:{top:0,right:0,bottom:0,left:0},label:void 0,labelHighlightBold:!0,level:void 0,margin:{top:5,right:5,bottom:5,left:5},mass:1,physics:!0,scaling:{min:10,max:30,label:{enabled:!1,min:14,max:30,maxVisible:30,drawThreshold:5},customScalingFunction:function(t,e,i,o){if(e===t)return .5;var n=1/(e-t);return Math.max(0,(o-t)*n)}},shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:10,x:5,y:5},shape:"ellipse",shapeProperties:{borderDashes:!1,borderRadius:6,interpolation:!0,useImageSize:!1,useBorderWithImage:!1,coordinateOrigin:"center"},size:25,title:void 0,value:void 0,x:void 0,y:void 0},this.defaultOptions.mass<=0)throw "Internal error: mass in defaultOptions of NodesHandler may not be zero or negative";this.options=Qr(this.defaultOptions),this.bindEventListeners();}return Zh(t,[{key:"bindEventListeners",value:function(){var t,e,i=this;this.body.emitter.on("refreshNodes",Q(t=this.refresh).call(t,this)),this.body.emitter.on("refresh",Q(e=this.refresh).call(e,this)),this.body.emitter.on("destroy",(function(){Hr(i.nodesListeners,(function(t,e){i.body.data.nodes&&i.body.data.nodes.off(e,t);})),delete i.body.functions.createNode,delete i.nodesListeners.add,delete i.nodesListeners.update,delete i.nodesListeners.remove,delete i.nodesListeners;}));}},{key:"setOptions",value:function(t){if(void 0!==t){if(vc.parseOptions(this.options,t),void 0!==t.opacity&&(Id(t.opacity)||!Pd(t.opacity)||t.opacity<0||t.opacity>1?console.error("Invalid option for node opacity. Value must be between 0 and 1, found: "+t.opacity):this.options.opacity=t.opacity),void 0!==t.shape)for(var e in this.body.nodes)Object.prototype.hasOwnProperty.call(this.body.nodes,e)&&this.body.nodes[e].updateShape();if(void 0!==t.font||void 0!==t.widthConstraint||void 0!==t.heightConstraint)for(var i=0,o=ir(this.body.nodes);i<o.length;i++){var n=o[i];this.body.nodes[n].updateLabelModule(),this.body.nodes[n].needsRefresh();}if(void 0!==t.size)for(var r in this.body.nodes)Object.prototype.hasOwnProperty.call(this.body.nodes,r)&&this.body.nodes[r].needsRefresh();void 0===t.hidden&&void 0===t.physics||this.body.emitter.emit("_dataChanged");}}},{key:"setData",value:function(t){var i=arguments.length>1&&void 0!==arguments[1]&&arguments[1],o=this.body.data.nodes;if(e.isDataViewLike("id",t))this.body.data.nodes=t;else if(dr(t))this.body.data.nodes=new e.DataSet,this.body.data.nodes.add(t);else {if(t)throw new TypeError("Array or DataSet expected");this.body.data.nodes=new e.DataSet;}if(o&&Hr(this.nodesListeners,(function(t,e){o.off(e,t);})),this.body.nodes={},this.body.data.nodes){var n=this;Hr(this.nodesListeners,(function(t,e){n.body.data.nodes.on(e,t);}));var r=this.body.data.nodes.getIds();this.add(r,!0);}!1===i&&this.body.emitter.emit("_dataChanged");}},{key:"add",value:function(t){for(var e,i=arguments.length>1&&void 0!==arguments[1]&&arguments[1],o=[],n=0;n<t.length;n++){e=t[n];var r=this.body.data.nodes.get(e),s=this.create(r);o.push(s),this.body.nodes[e]=s;}this.layoutEngine.positionInitially(o),!1===i&&this.body.emitter.emit("_dataChanged");}},{key:"update",value:function(t,e,i){for(var o=this.body.nodes,n=!1,r=0;r<t.length;r++){var s=t[r],a=o[s],h=e[r];void 0!==a?a.setOptions(h)&&(n=!0):(n=!0,a=this.create(h),o[s]=a);}n||void 0===i||(n=Td(e).call(e,(function(t,e){var o=i[e];return o&&o.level!==t.level}))),!0===n?this.body.emitter.emit("_dataChanged"):this.body.emitter.emit("_dataUpdated");}},{key:"remove",value:function(t){for(var e=this.body.nodes,i=0;i<t.length;i++){delete e[t[i]];}this.body.emitter.emit("_dataChanged");}},{key:"create",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:vc;return new e(t,this.body,this.images,this.groups,this.options,this.defaultOptions)}},{key:"refresh",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];Hr(this.body.nodes,(function(i,o){var n=t.body.data.nodes.get(o);void 0!==n&&(!0===e&&i.setOptions({x:null,y:null}),i.setOptions({fixed:!1}),i.setOptions(n));}));}},{key:"getPositions",value:function(t){var e={};if(void 0!==t){if(!0===dr(t)){for(var i=0;i<t.length;i++)if(void 0!==this.body.nodes[t[i]]){var o=this.body.nodes[t[i]];e[t[i]]={x:Math.round(o.x),y:Math.round(o.y)};}}else if(void 0!==this.body.nodes[t]){var n=this.body.nodes[t];e[t]={x:Math.round(n.x),y:Math.round(n.y)};}}else for(var r=0;r<this.body.nodeIndices.length;r++){var s=this.body.nodes[this.body.nodeIndices[r]];e[this.body.nodeIndices[r]]={x:Math.round(s.x),y:Math.round(s.y)};}return e}},{key:"getPosition",value:function(t){if(null==t)throw new TypeError("No id was specified for getPosition method.");if(null==this.body.nodes[t])throw new ReferenceError("NodeId provided for getPosition does not exist. Provided: ".concat(t));return {x:Math.round(this.body.nodes[t].x),y:Math.round(this.body.nodes[t].y)}}},{key:"storePositions",value:function(){var t,e=[],i=this.body.data.nodes.getDataSet(),o=gc(i.get());try{for(o.s();!(t=o.n()).done;){var n=t.value,r=n.id,s=this.body.nodes[r],a=Math.round(s.x),h=Math.round(s.y);n.x===a&&n.y===h||e.push({id:r,x:a,y:h});}}catch(t){o.e(t);}finally{o.f();}i.update(e);}},{key:"getBoundingBox",value:function(t){if(void 0!==this.body.nodes[t])return this.body.nodes[t].shape.boundingBox}},{key:"getConnectedNodes",value:function(t,e){var i=[];if(void 0!==this.body.nodes[t])for(var o=this.body.nodes[t],n={},r=0;r<o.edges.length;r++){var s=o.edges[r];"to"!==e&&s.toId==o.id?void 0===n[s.fromId]&&(i.push(s.fromId),n[s.fromId]=!0):"from"!==e&&s.fromId==o.id&&void 0===n[s.toId]&&(i.push(s.toId),n[s.toId]=!0);}return i}},{key:"getConnectedEdges",value:function(t){var e=[];if(void 0!==this.body.nodes[t])for(var i=this.body.nodes[t],o=0;o<i.edges.length;o++)e.push(i.edges[o].id);else console.error("NodeId provided for getConnectedEdges does not exist. Provided: ",t);return e}},{key:"moveNode",value:function(t,e,i){var o=this;void 0!==this.body.nodes[t]?(this.body.nodes[t].x=Number(e),this.body.nodes[t].y=Number(i),_d((function(){o.body.emitter.emit("startSimulation");}),0)):console.error("Node id supplied to moveNode does not exist. Provided: ",t);}}]),t}(),bc=Ht;q({target:"Reflect",stat:!0},{get:function t(e,i){var o,n,r=arguments.length<3?e:arguments[2];return R(e)===r?e[i]:(o=S.f(e,i))?k(o,"value")?o.value:void 0===o.get?void 0:o.get.call(r):m(n=Di(e))?t(n,i,r):void 0}});var wc=F.Reflect.get;var kc=function(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=fl(t)););return t},_c=o((function(t){function e(i,o,n){return "undefined"!=typeof Reflect&&wc?t.exports=e=wc:t.exports=e=function(t,e,i){var o=kc(t,e);if(o){var n=bc(o,e);return n.get?n.get.call(i):n.value}},e(i,o,n||i)}t.exports=e;})),xc=Math.hypot,Ec=Math.abs,Oc=Math.sqrt,Cc=!!xc&&xc(1/0,NaN)!==1/0;q({target:"Math",stat:!0,forced:Cc},{hypot:function(t,e){for(var i,o,n=0,r=0,s=arguments.length,a=0;r<s;)a<(i=Ec(arguments[r++]))?(n=n*(o=a/i)*o+1,a=i):n+=i>0?(o=i/a)*o:i;return a===1/0?1/0:a*Oc(n)}});var Sc=F.Math.hypot;function Tc(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Mc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"transform",value:function(t,e){dr(t)||(t=[t]);for(var i=e.point.x,o=e.point.y,n=e.angle,r=e.length,s=0;s<t.length;++s){var a=t[s],h=a.x*Math.cos(n)-a.y*Math.sin(n),d=a.x*Math.sin(n)+a.y*Math.cos(n);a.x=i+r*h,a.y=o+r*d;}}},{key:"drawPath",value:function(t,e){t.beginPath(),t.moveTo(e[0].x,e[0].y);for(var i=1;i<e.length;++i)t.lineTo(e[i].x,e[i].y);t.closePath();}}]),t}(),Dc=function(t){dl(i,t);var e=Tc(i);function i(){return Kh(this,i),e.apply(this,arguments)}return Zh(i,null,[{key:"draw",value:function(t,e){if(e.image){t.save(),t.translate(e.point.x,e.point.y),t.rotate(Math.PI/2+e.angle);var i=null!=e.imageWidth?e.imageWidth:e.image.width,o=null!=e.imageHeight?e.imageHeight:e.image.height;e.image.drawImageAtPosition(t,1,-i/2,0,i,o),t.restore();}return !1}}]),i}(Mc),Pc=function(t){dl(i,t);var e=Tc(i);function i(){return Kh(this,i),e.apply(this,arguments)}return Zh(i,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:0},{x:-1,y:.3},{x:-.9,y:0},{x:-1,y:-.3}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),i}(Mc),Ic=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i=[{x:-1,y:0},{x:0,y:.3},{x:-.4,y:0},{x:0,y:-.3}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),t}(),zc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i={x:-.4,y:0};Mc.transform(i,e),t.strokeStyle=t.fillStyle,t.fillStyle="rgba(0, 0, 0, 0)";var o=Math.PI,n=e.angle-o/2,r=e.angle+o/2;return t.beginPath(),t.arc(i.x,i.y,.4*e.length,n,r,!1),t.stroke(),!0}}]),t}(),Bc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i={x:-.3,y:0};Mc.transform(i,e),t.strokeStyle=t.fillStyle,t.fillStyle="rgba(0, 0, 0, 0)";var o=Math.PI,n=e.angle+o/2,r=e.angle+3*o/2;return t.beginPath(),t.arc(i.x,i.y,.4*e.length,n,r,!1),t.stroke(),!0}}]),t}(),Fc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i=[{x:.02,y:0},{x:-1,y:.3},{x:-1,y:-.3}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),t}(),Nc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:.3},{x:0,y:-.3},{x:-1,y:0}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),t}(),Ac=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i={x:-.4,y:0};return Mc.transform(i,e),wt(t,i.x,i.y,.4*e.length),!0}}]),t}(),Rc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:.5},{x:0,y:-.5},{x:-.15,y:-.5},{x:-.15,y:.5}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),t}(),jc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:.3},{x:0,y:-.3},{x:-.6,y:-.3},{x:-.6,y:.3}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),t}(),Lc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i=[{x:0,y:0},{x:-.5,y:-.3},{x:-1,y:0},{x:-.5,y:.3}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),t}(),Hc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i=[{x:-1,y:.3},{x:-.5,y:0},{x:-1,y:-.3},{x:0,y:0}];return Mc.transform(i,e),Mc.drawPath(t,i),!0}}]),t}(),Wc=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"draw",value:function(t,e){var i;switch(e.type&&(i=e.type.toLowerCase()),i){case"image":return Dc.draw(t,e);case"circle":return Ac.draw(t,e);case"box":return jc.draw(t,e);case"crow":return Ic.draw(t,e);case"curve":return zc.draw(t,e);case"diamond":return Lc.draw(t,e);case"inv_curve":return Bc.draw(t,e);case"triangle":return Fc.draw(t,e);case"inv_triangle":return Nc.draw(t,e);case"bar":return Rc.draw(t,e);case"vee":return Hc.draw(t,e);case"arrow":default:return Pc.draw(t,e)}}}]),t}();function Vc(t,e){var i=ir(t);if(Oi){var o=Oi(t);e&&(o=pn(o).call(o,(function(e){return Wt(t,e).enumerable}))),i.push.apply(i,o);}return i}function qc(t){for(var e=1;e<arguments.length;e++){var i,o=null!=arguments[e]?arguments[e]:{};if(e%2)qo(i=Vc(Object(o),!0)).call(i,(function(e){Eo(t,e,o[e]);}));else if(At)Dt(t,At(o));else {var n;qo(n=Vc(Object(o))).call(n,(function(e){Tt(t,e,Wt(o,e));}));}}return t}var Uc=function(){function t(e,i,o){Kh(this,t),this._body=i,this._labelModule=o,this.color={},this.colorDirty=!0,this.hoverWidth=1.5,this.selectionWidth=2,this.setOptions(e),this.fromPoint=this.from,this.toPoint=this.to;}return Zh(t,[{key:"connect",value:function(){this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to];}},{key:"cleanup",value:function(){return !1}},{key:"setOptions",value:function(t){this.options=t,this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to],this.id=this.options.id;}},{key:"drawLine",value:function(t,e,i,o){var n=arguments.length>4&&void 0!==arguments[4]?arguments[4]:this.getViaNode();t.strokeStyle=this.getColor(t,e),t.lineWidth=e.width,!1!==e.dashes?this._drawDashedLine(t,e,n):this._drawLine(t,e,n);}},{key:"_drawLine",value:function(t,e,i,o,n){if(this.from!=this.to)this._line(t,e,i,o,n);else {var r=this._getCircleData(t),s=Jn(r,3),a=s[0],h=s[1],d=s[2];this._circle(t,e,a,h,d);}}},{key:"_drawDashedLine",value:function(t,e,i,o,n){t.lineCap="round";var r=dr(e.dashes)?e.dashes:[5,5];if(void 0!==t.setLineDash){if(t.save(),t.setLineDash(r),t.lineDashOffset=0,this.from!=this.to)this._line(t,e,i);else {var s=this._getCircleData(t),a=Jn(s,3),h=a[0],d=a[1],l=a[2];this._circle(t,e,h,d,l);}t.setLineDash([0]),t.lineDashOffset=0,t.restore();}else {if(this.from!=this.to)Et(t,this.from.x,this.from.y,this.to.x,this.to.y,r);else {var c=this._getCircleData(t),u=Jn(c,3),f=u[0],p=u[1],v=u[2];this._circle(t,e,f,p,v);}this.enableShadow(t,e),t.stroke(),this.disableShadow(t,e);}}},{key:"findBorderPosition",value:function(t,e,i){return this.from!=this.to?this._findBorderPosition(t,e,i):this._findBorderPositionCircle(t,e,i)}},{key:"findBorderPositions",value:function(t){if(this.from!=this.to)return {from:this._findBorderPosition(this.from,t),to:this._findBorderPosition(this.to,t)};var e,i=ur(e=this._getCircleData(t)).call(e,0,2),o=Jn(i,2),n=o[0],r=o[1];return {from:this._findBorderPositionCircle(this.from,t,{x:n,y:r,low:.25,high:.6,direction:-1}),to:this._findBorderPositionCircle(this.from,t,{x:n,y:r,low:.6,high:.8,direction:1})}}},{key:"_getCircleData",value:function(t){var e=this.options.selfReference.size;void 0!==t&&void 0===this.from.shape.width&&this.from.shape.resize(t);var i=qd(t,this.options.selfReference.angle,e,this.from);return [i.x,i.y,e]}},{key:"_pointOnCircle",value:function(t,e,i,o){var n=2*o*Math.PI;return {x:t+i*Math.cos(n),y:e-i*Math.sin(n)}}},{key:"_findBorderPositionCircle",value:function(t,e,i){var o,n=i.x,r=i.y,s=i.low,a=i.high,h=i.direction,d=this.options.selfReference.size,l=.5*(s+a),c=0;!0===this.options.arrowStrikethrough&&(-1===h?c=this.options.endPointOffset.from:1===h&&(c=this.options.endPointOffset.to));var u=0;do{l=.5*(s+a),o=this._pointOnCircle(n,r,d,l);var f=Math.atan2(t.y-o.y,t.x-o.x),p=t.distanceToBorder(e,f)+c-Math.sqrt(Math.pow(o.x-t.x,2)+Math.pow(o.y-t.y,2));if(Math.abs(p)<.05)break;p>0?h>0?s=l:a=l:h>0?a=l:s=l,++u;}while(s<=a&&u<10);return qc(qc({},o),{},{t:l})}},{key:"getLineWidth",value:function(t,e){return !0===t?Math.max(this.selectionWidth,.3/this._body.view.scale):!0===e?Math.max(this.hoverWidth,.3/this._body.view.scale):Math.max(this.options.width,.3/this._body.view.scale)}},{key:"getColor",value:function(t,e){if(!1!==e.inheritsColor){if("both"===e.inheritsColor&&this.from.id!==this.to.id){var i=t.createLinearGradient(this.from.x,this.from.y,this.to.x,this.to.y),o=this.from.options.color.highlight.border,n=this.to.options.color.highlight.border;return !1===this.from.selected&&!1===this.to.selected?(o=Vr(this.from.options.color.border,e.opacity),n=Vr(this.to.options.color.border,e.opacity)):!0===this.from.selected&&!1===this.to.selected?n=this.to.options.color.border:!1===this.from.selected&&!0===this.to.selected&&(o=this.from.options.color.border),i.addColorStop(0,o),i.addColorStop(1,n),i}return "to"===e.inheritsColor?Vr(this.to.options.color.border,e.opacity):Vr(this.from.options.color.border,e.opacity)}return Vr(e.color,e.opacity)}},{key:"_circle",value:function(t,e,i,o,n){this.enableShadow(t,e);var r=0,s=2*Math.PI;if(!this.options.selfReference.renderBehindTheNode){var a=this.options.selfReference.angle,h=this.options.selfReference.angle+Math.PI,d=this._findBorderPositionCircle(this.from,t,{x:i,y:o,low:a,high:h,direction:-1}),l=this._findBorderPositionCircle(this.from,t,{x:i,y:o,low:a,high:h,direction:1});r=Math.atan2(d.y-o,d.x-i),s=Math.atan2(l.y-o,l.x-i);}t.beginPath(),t.arc(i,o,n,r,s,!1),t.stroke(),this.disableShadow(t,e);}},{key:"getDistanceToEdge",value:function(t,e,i,o,n,r){if(this.from!=this.to)return this._getDistanceToEdge(t,e,i,o,n,r);var s=this._getCircleData(void 0),a=Jn(s,3),h=a[0],d=a[1],l=a[2],c=h-n,u=d-r;return Math.abs(Math.sqrt(c*c+u*u)-l)}},{key:"_getDistanceToLine",value:function(t,e,i,o,n,r){var s=i-t,a=o-e,h=((n-t)*s+(r-e)*a)/(s*s+a*a);h>1?h=1:h<0&&(h=0);var d=t+h*s-n,l=e+h*a-r;return Math.sqrt(d*d+l*l)}},{key:"getArrowData",value:function(t,e,i,o,n,r){var s,a,h,d,l,c,u,f=r.width;"from"===e?(h=this.from,d=this.to,l=r.fromArrowScale<0,c=Math.abs(r.fromArrowScale),u=r.fromArrowType):"to"===e?(h=this.to,d=this.from,l=r.toArrowScale<0,c=Math.abs(r.toArrowScale),u=r.toArrowType):(h=this.to,d=this.from,l=r.middleArrowScale<0,c=Math.abs(r.middleArrowScale),u=r.middleArrowType);var p=15*c+3*f;if(h!=d){var v=p/Sc(h.x-d.x,h.y-d.y);if("middle"!==e)if(!0===this.options.smooth.enabled){var g=this._findBorderPosition(h,t,{via:i}),y=this.getPoint(g.t+v*("from"===e?1:-1),i);s=Math.atan2(g.y-y.y,g.x-y.x),a=g;}else s=Math.atan2(h.y-d.y,h.x-d.x),a=this._findBorderPosition(h,t);else {var m=(l?-v:v)/2,b=this.getPoint(.5+m,i),w=this.getPoint(.5-m,i);s=Math.atan2(b.y-w.y,b.x-w.x),a=this.getPoint(.5,i);}}else {var k=this._getCircleData(t),_=Jn(k,3),x=_[0],E=_[1],O=_[2];if("from"===e){var C=this.options.selfReference.angle,S=this.options.selfReference.angle+Math.PI,T=this._findBorderPositionCircle(this.from,t,{x:x,y:E,low:C,high:S,direction:-1});s=-2*T.t*Math.PI+1.5*Math.PI+.1*Math.PI,a=T;}else if("to"===e){var M=this.options.selfReference.angle,D=this.options.selfReference.angle+Math.PI,P=this._findBorderPositionCircle(this.from,t,{x:x,y:E,low:M,high:D,direction:1});s=-2*P.t*Math.PI+1.5*Math.PI-1.1*Math.PI,a=P;}else {var I=this.options.selfReference.angle/(2*Math.PI);a=this._pointOnCircle(x,E,O,I),s=-2*I*Math.PI+1.5*Math.PI+.1*Math.PI;}}return {point:a,core:{x:a.x-.9*p*Math.cos(s),y:a.y-.9*p*Math.sin(s)},angle:s,length:p,type:u}}},{key:"drawArrowHead",value:function(t,e,i,o,n){t.strokeStyle=this.getColor(t,e),t.fillStyle=t.strokeStyle,t.lineWidth=e.width,Wc.draw(t,n)&&(this.enableShadow(t,e),gl(t).call(t),this.disableShadow(t,e));}},{key:"enableShadow",value:function(t,e){!0===e.shadow&&(t.shadowColor=e.shadowColor,t.shadowBlur=e.shadowSize,t.shadowOffsetX=e.shadowX,t.shadowOffsetY=e.shadowY);}},{key:"disableShadow",value:function(t,e){!0===e.shadow&&(t.shadowColor="rgba(0,0,0,0)",t.shadowBlur=0,t.shadowOffsetX=0,t.shadowOffsetY=0);}},{key:"drawBackground",value:function(t,e){if(!1!==e.background){var i={strokeStyle:t.strokeStyle,lineWidth:t.lineWidth,dashes:t.dashes};t.strokeStyle=e.backgroundColor,t.lineWidth=e.backgroundSize,this.setStrokeDashed(t,e.backgroundDashes),t.stroke(),t.strokeStyle=i.strokeStyle,t.lineWidth=i.lineWidth,t.dashes=i.dashes,this.setStrokeDashed(t,e.dashes);}}},{key:"setStrokeDashed",value:function(t,e){if(!1!==e)if(void 0!==t.setLineDash){var i=dr(e)?e:[5,5];t.setLineDash(i);}else console.warn("setLineDash is not supported in this browser. The dashed stroke cannot be used.");else void 0!==t.setLineDash?t.setLineDash([]):console.warn("setLineDash is not supported in this browser. The dashed stroke cannot be used.");}}]),t}();function Yc(t,e){var i=ir(t);if(Oi){var o=Oi(t);e&&(o=pn(o).call(o,(function(e){return Wt(t,e).enumerable}))),i.push.apply(i,o);}return i}function Xc(t){for(var e=1;e<arguments.length;e++){var i,o=null!=arguments[e]?arguments[e]:{};if(e%2)qo(i=Yc(Object(o),!0)).call(i,(function(e){Eo(t,e,o[e]);}));else if(At)Dt(t,At(o));else {var n;qo(n=Yc(Object(o))).call(n,(function(e){Tt(t,e,Wt(o,e));}));}}return t}function Gc(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Kc=function(t){dl(i,t);var e=Gc(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"_findBorderPositionBezier",value:function(t,e){var i,o,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this._getViaCoordinates(),r=10,s=.2,a=!1,h=1,d=0,l=this.to,c=this.options.endPointOffset?this.options.endPointOffset.to:0;t.id===this.from.id&&(l=this.from,a=!0,c=this.options.endPointOffset?this.options.endPointOffset.from:0),!1===this.options.arrowStrikethrough&&(c=0);var u=0;do{o=.5*(d+h),i=this.getPoint(o,n);var f=Math.atan2(l.y-i.y,l.x-i.x),p=l.distanceToBorder(e,f)+c,v=Math.sqrt(Math.pow(i.x-l.x,2)+Math.pow(i.y-l.y,2)),g=p-v;if(Math.abs(g)<s)break;g<0?!1===a?d=o:h=o:!1===a?h=o:d=o,++u;}while(d<=h&&u<r);return Xc(Xc({},i),{},{t:o})}},{key:"_getDistanceToBezierEdge",value:function(t,e,i,o,n,r,s){var a,h,d,l,c,u=1e9,f=t,p=e;for(h=1;h<10;h++)d=.1*h,l=Math.pow(1-d,2)*t+2*d*(1-d)*s.x+Math.pow(d,2)*i,c=Math.pow(1-d,2)*e+2*d*(1-d)*s.y+Math.pow(d,2)*o,h>0&&(u=(a=this._getDistanceToLine(f,p,l,c,n,r))<u?a:u),f=l,p=c;return u}},{key:"_bezierCurve",value:function(t,e,i,o){t.beginPath(),t.moveTo(this.fromPoint.x,this.fromPoint.y),null!=i&&null!=i.x?null!=o&&null!=o.x?t.bezierCurveTo(i.x,i.y,o.x,o.y,this.toPoint.x,this.toPoint.y):t.quadraticCurveTo(i.x,i.y,this.toPoint.x,this.toPoint.y):t.lineTo(this.toPoint.x,this.toPoint.y),this.drawBackground(t,e),this.enableShadow(t,e),t.stroke(),this.disableShadow(t,e);}},{key:"getViaNode",value:function(){return this._getViaCoordinates()}}]),i}(Uc);function $c(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Zc=function(t){dl(i,t);var e=$c(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n)).via=r.via,r._boundFunction=function(){r.positionBezierNode();},r._body.emitter.on("_repositionBezierNodes",r._boundFunction),r}return Zh(i,[{key:"setOptions",value:function(t){_c(fl(i.prototype),"setOptions",this).call(this,t);var e=!1;this.options.physics!==t.physics&&(e=!0),this.options=t,this.id=this.options.id,this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to],this.setupSupportNode(),this.connect(),!0===e&&(this.via.setOptions({physics:this.options.physics}),this.positionBezierNode());}},{key:"connect",value:function(){this.from=this._body.nodes[this.options.from],this.to=this._body.nodes[this.options.to],void 0===this.from||void 0===this.to||!1===this.options.physics||this.from.id===this.to.id?this.via.setOptions({physics:!1}):this.via.setOptions({physics:!0});}},{key:"cleanup",value:function(){return this._body.emitter.off("_repositionBezierNodes",this._boundFunction),void 0!==this.via&&(delete this._body.nodes[this.via.id],this.via=void 0,!0)}},{key:"setupSupportNode",value:function(){if(void 0===this.via){var t="edgeId:"+this.id,e=this._body.functions.createNode({id:t,shape:"circle",physics:!0,hidden:!0});this._body.nodes[t]=e,this.via=e,this.via.parentEdgeId=this.id,this.positionBezierNode();}}},{key:"positionBezierNode",value:function(){void 0!==this.via&&void 0!==this.from&&void 0!==this.to?(this.via.x=.5*(this.from.x+this.to.x),this.via.y=.5*(this.from.y+this.to.y)):void 0!==this.via&&(this.via.x=0,this.via.y=0);}},{key:"_line",value:function(t,e,i){this._bezierCurve(t,e,i);}},{key:"_getViaCoordinates",value:function(){return this.via}},{key:"getViaNode",value:function(){return this.via}},{key:"getPoint",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.via;if(this.from===this.to){var i=this._getCircleData(),o=Jn(i,3),n=o[0],r=o[1],s=o[2],a=2*Math.PI*(1-t);return {x:n+s*Math.sin(a),y:r+s-s*(1-Math.cos(a))}}return {x:Math.pow(1-t,2)*this.fromPoint.x+2*t*(1-t)*e.x+Math.pow(t,2)*this.toPoint.x,y:Math.pow(1-t,2)*this.fromPoint.y+2*t*(1-t)*e.y+Math.pow(t,2)*this.toPoint.y}}},{key:"_findBorderPosition",value:function(t,e){return this._findBorderPositionBezier(t,e,this.via)}},{key:"_getDistanceToEdge",value:function(t,e,i,o,n,r){return this._getDistanceToBezierEdge(t,e,i,o,n,r,this.via)}}]),i}(Kc);function Qc(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Jc=function(t){dl(i,t);var e=Qc(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"_line",value:function(t,e,i){this._bezierCurve(t,e,i);}},{key:"getViaNode",value:function(){return this._getViaCoordinates()}},{key:"_getViaCoordinates",value:function(){var t,e,i=this.options.smooth.roundness,o=this.options.smooth.type,n=Math.abs(this.from.x-this.to.x),r=Math.abs(this.from.y-this.to.y);if("discrete"===o||"diagonalCross"===o){var s,a;s=a=n<=r?i*r:i*n,this.from.x>this.to.x&&(s=-s),this.from.y>=this.to.y&&(a=-a);var h=this.from.x+s,d=this.from.y+a;return "discrete"===o&&(n<=r?h=n<i*r?this.from.x:h:d=r<i*n?this.from.y:d),{x:h,y:d}}if("straightCross"===o){var l=(1-i)*n,c=(1-i)*r;return n<=r?(l=0,this.from.y<this.to.y&&(c=-c)):(this.from.x<this.to.x&&(l=-l),c=0),{x:this.to.x+l,y:this.to.y+c}}if("horizontal"===o){var u=(1-i)*n;return this.from.x<this.to.x&&(u=-u),{x:this.to.x+u,y:this.from.y}}if("vertical"===o){var f=(1-i)*r;return this.from.y<this.to.y&&(f=-f),{x:this.from.x,y:this.to.y+f}}if("curvedCW"===o){n=this.to.x-this.from.x,r=this.from.y-this.to.y;var p=Math.sqrt(n*n+r*r),v=Math.PI,g=(Math.atan2(r,n)+(.5*i+.5)*v)%(2*v);return {x:this.from.x+(.5*i+.5)*p*Math.sin(g),y:this.from.y+(.5*i+.5)*p*Math.cos(g)}}if("curvedCCW"===o){n=this.to.x-this.from.x,r=this.from.y-this.to.y;var y=Math.sqrt(n*n+r*r),m=Math.PI,b=(Math.atan2(r,n)+(.5*-i+.5)*m)%(2*m);return {x:this.from.x+(.5*i+.5)*y*Math.sin(b),y:this.from.y+(.5*i+.5)*y*Math.cos(b)}}t=e=n<=r?i*r:i*n,this.from.x>this.to.x&&(t=-t),this.from.y>=this.to.y&&(e=-e);var w=this.from.x+t,k=this.from.y+e;return n<=r?w=this.from.x<=this.to.x?this.to.x<w?this.to.x:w:this.to.x>w?this.to.x:w:k=this.from.y>=this.to.y?this.to.y>k?this.to.y:k:this.to.y<k?this.to.y:k,{x:w,y:k}}},{key:"_findBorderPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return this._findBorderPositionBezier(t,e,i.via)}},{key:"_getDistanceToEdge",value:function(t,e,i,o,n,r){var s=arguments.length>6&&void 0!==arguments[6]?arguments[6]:this._getViaCoordinates();return this._getDistanceToBezierEdge(t,e,i,o,n,r,s)}},{key:"getPoint",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this._getViaCoordinates(),i=t,o=Math.pow(1-i,2)*this.fromPoint.x+2*i*(1-i)*e.x+Math.pow(i,2)*this.toPoint.x,n=Math.pow(1-i,2)*this.fromPoint.y+2*i*(1-i)*e.y+Math.pow(i,2)*this.toPoint.y;return {x:o,y:n}}}]),i}(Kc);function tu(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}function eu(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var iu=function(t){dl(i,t);var e=eu(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"_line",value:function(t,e,i){var o=i[0],n=i[1];this._bezierCurve(t,e,o,n);}},{key:"_getViaCoordinates",value:function(){var t,e,i,o,n=this.from.x-this.to.x,r=this.from.y-this.to.y,s=this.options.smooth.roundness;return (Math.abs(n)>Math.abs(r)||!0===this.options.smooth.forceDirection||"horizontal"===this.options.smooth.forceDirection)&&"vertical"!==this.options.smooth.forceDirection?(e=this.from.y,o=this.to.y,t=this.from.x-s*n,i=this.to.x+s*n):(e=this.from.y-s*r,o=this.to.y+s*r,t=this.from.x,i=this.to.x),[{x:t,y:e},{x:i,y:o}]}},{key:"getViaNode",value:function(){return this._getViaCoordinates()}},{key:"_findBorderPosition",value:function(t,e){return this._findBorderPositionBezier(t,e)}},{key:"_getDistanceToEdge",value:function(t,e,i,o,n,r){var s=arguments.length>6&&void 0!==arguments[6]?arguments[6]:this._getViaCoordinates(),a=Jn(s,2),h=a[0],d=a[1];return this._getDistanceToBezierEdge2(t,e,i,o,n,r,h,d)}},{key:"getPoint",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this._getViaCoordinates(),i=Jn(e,2),o=i[0],n=i[1],r=t,s=[Math.pow(1-r,3),3*r*Math.pow(1-r,2),3*Math.pow(r,2)*(1-r),Math.pow(r,3)],a=s[0]*this.fromPoint.x+s[1]*o.x+s[2]*n.x+s[3]*this.toPoint.x,h=s[0]*this.fromPoint.y+s[1]*o.y+s[2]*n.y+s[3]*this.toPoint.y;return {x:a,y:h}}}]),i}(function(t){dl(i,t);var e=tu(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"_getDistanceToBezierEdge2",value:function(t,e,i,o,n,r,s,a){for(var h=1e9,d=t,l=e,c=[0,0,0,0],u=1;u<10;u++){var f=.1*u;c[0]=Math.pow(1-f,3),c[1]=3*f*Math.pow(1-f,2),c[2]=3*Math.pow(f,2)*(1-f),c[3]=Math.pow(f,3);var p=c[0]*t+c[1]*s.x+c[2]*a.x+c[3]*i,v=c[0]*e+c[1]*s.y+c[2]*a.y+c[3]*o;if(u>0){var g=this._getDistanceToLine(d,l,p,v,n,r);h=g<h?g:h;}d=p,l=v;}return h}}]),i}(Kc));function ou(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var nu=function(t){dl(i,t);var e=ou(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"_line",value:function(t,e){t.beginPath(),t.moveTo(this.fromPoint.x,this.fromPoint.y),t.lineTo(this.toPoint.x,this.toPoint.y),this.enableShadow(t,e),t.stroke(),this.disableShadow(t,e);}},{key:"getViaNode",value:function(){}},{key:"getPoint",value:function(t){return {x:(1-t)*this.fromPoint.x+t*this.toPoint.x,y:(1-t)*this.fromPoint.y+t*this.toPoint.y}}},{key:"_findBorderPosition",value:function(t,e){var i=this.to,o=this.from;t.id===this.from.id&&(i=this.from,o=this.to);var n=Math.atan2(i.y-o.y,i.x-o.x),r=i.x-o.x,s=i.y-o.y,a=Math.sqrt(r*r+s*s),h=(a-t.distanceToBorder(e,n))/a;return {x:(1-h)*o.x+h*i.x,y:(1-h)*o.y+h*i.y,t:0}}},{key:"_getDistanceToEdge",value:function(t,e,i,o,n,r){return this._getDistanceToLine(t,e,i,o,n,r)}}]),i}(Uc),ru=function(){function t(e,i,o,n,r){if(Kh(this,t),void 0===i)throw new Error("No body provided");this.options=Qr(n),this.globalOptions=n,this.defaultOptions=r,this.body=i,this.imagelist=o,this.id=void 0,this.fromId=void 0,this.toId=void 0,this.selected=!1,this.hover=!1,this.labelDirty=!0,this.baseWidth=this.options.width,this.baseFontSize=this.options.font.size,this.from=void 0,this.to=void 0,this.edgeType=void 0,this.connected=!1,this.labelModule=new tl(this.body,this.options,!0),this.setOptions(e);}return Zh(t,[{key:"setOptions",value:function(e){if(e){var i=void 0!==e.physics&&this.options.physics!==e.physics||void 0!==e.hidden&&(this.options.hidden||!1)!==(e.hidden||!1)||void 0!==e.from&&this.options.from!==e.from||void 0!==e.to&&this.options.to!==e.to;t.parseOptions(this.options,e,!0,this.globalOptions),void 0!==e.id&&(this.id=e.id),void 0!==e.from&&(this.fromId=e.from),void 0!==e.to&&(this.toId=e.to),void 0!==e.title&&(this.title=e.title),void 0!==e.value&&(e.value=Ld(e.value));var o=[e,this.options,this.defaultOptions];return this.chooser=Hd("edge",o),this.updateLabelModule(e),i=this.updateEdgeType()||i,this._setInteractionWidths(),this.connect(),i}}},{key:"getFormattingValues",value:function(){var t=!0===this.options.arrows.to||!0===this.options.arrows.to.enabled,e=!0===this.options.arrows.from||!0===this.options.arrows.from.enabled,i=!0===this.options.arrows.middle||!0===this.options.arrows.middle.enabled,o=this.options.color.inherit,n={toArrow:t,toArrowScale:this.options.arrows.to.scaleFactor,toArrowType:this.options.arrows.to.type,toArrowSrc:this.options.arrows.to.src,toArrowImageWidth:this.options.arrows.to.imageWidth,toArrowImageHeight:this.options.arrows.to.imageHeight,middleArrow:i,middleArrowScale:this.options.arrows.middle.scaleFactor,middleArrowType:this.options.arrows.middle.type,middleArrowSrc:this.options.arrows.middle.src,middleArrowImageWidth:this.options.arrows.middle.imageWidth,middleArrowImageHeight:this.options.arrows.middle.imageHeight,fromArrow:e,fromArrowScale:this.options.arrows.from.scaleFactor,fromArrowType:this.options.arrows.from.type,fromArrowSrc:this.options.arrows.from.src,fromArrowImageWidth:this.options.arrows.from.imageWidth,fromArrowImageHeight:this.options.arrows.from.imageHeight,arrowStrikethrough:this.options.arrowStrikethrough,color:o?void 0:this.options.color.color,inheritsColor:o,opacity:this.options.color.opacity,hidden:this.options.hidden,length:this.options.length,shadow:this.options.shadow.enabled,shadowColor:this.options.shadow.color,shadowSize:this.options.shadow.size,shadowX:this.options.shadow.x,shadowY:this.options.shadow.y,dashes:this.options.dashes,width:this.options.width,background:this.options.background.enabled,backgroundColor:this.options.background.color,backgroundSize:this.options.background.size,backgroundDashes:this.options.background.dashes};if(this.selected||this.hover)if(!0===this.chooser){if(this.selected){var r=this.options.selectionWidth;"function"==typeof r?n.width=r(n.width):"number"==typeof r&&(n.width+=r),n.width=Math.max(n.width,.3/this.body.view.scale),n.color=this.options.color.highlight,n.shadow=this.options.shadow.enabled;}else if(this.hover){var s=this.options.hoverWidth;"function"==typeof s?n.width=s(n.width):"number"==typeof s&&(n.width+=s),n.width=Math.max(n.width,.3/this.body.view.scale),n.color=this.options.color.hover,n.shadow=this.options.shadow.enabled;}}else "function"==typeof this.chooser&&(this.chooser(n,this.options.id,this.selected,this.hover),void 0!==n.color&&(n.inheritsColor=!1),!1===n.shadow&&(n.shadowColor===this.options.shadow.color&&n.shadowSize===this.options.shadow.size&&n.shadowX===this.options.shadow.x&&n.shadowY===this.options.shadow.y||(n.shadow=!0)));else n.shadow=this.options.shadow.enabled,n.width=Math.max(n.width,.3/this.body.view.scale);return n}},{key:"updateLabelModule",value:function(t){var e=[t,this.options,this.globalOptions,this.defaultOptions];this.labelModule.update(this.options,e),void 0!==this.labelModule.baseSize&&(this.baseFontSize=this.labelModule.baseSize);}},{key:"updateEdgeType",value:function(){var t=this.options.smooth,e=!1,i=!0;return void 0!==this.edgeType&&((this.edgeType instanceof Zc&&!0===t.enabled&&"dynamic"===t.type||this.edgeType instanceof iu&&!0===t.enabled&&"cubicBezier"===t.type||this.edgeType instanceof Jc&&!0===t.enabled&&"dynamic"!==t.type&&"cubicBezier"!==t.type||this.edgeType instanceof nu&&!1===t.type.enabled)&&(i=!1),!0===i&&(e=this.cleanup())),!0===i?!0===t.enabled?"dynamic"===t.type?(e=!0,this.edgeType=new Zc(this.options,this.body,this.labelModule)):"cubicBezier"===t.type?this.edgeType=new iu(this.options,this.body,this.labelModule):this.edgeType=new Jc(this.options,this.body,this.labelModule):this.edgeType=new nu(this.options,this.body,this.labelModule):this.edgeType.setOptions(this.options),e}},{key:"connect",value:function(){this.disconnect(),this.from=this.body.nodes[this.fromId]||void 0,this.to=this.body.nodes[this.toId]||void 0,this.connected=void 0!==this.from&&void 0!==this.to,!0===this.connected?(this.from.attachEdge(this),this.to.attachEdge(this)):(this.from&&this.from.detachEdge(this),this.to&&this.to.detachEdge(this)),this.edgeType.connect();}},{key:"disconnect",value:function(){this.from&&(this.from.detachEdge(this),this.from=void 0),this.to&&(this.to.detachEdge(this),this.to=void 0),this.connected=!1;}},{key:"getTitle",value:function(){return this.title}},{key:"isSelected",value:function(){return this.selected}},{key:"getValue",value:function(){return this.options.value}},{key:"setValueRange",value:function(t,e,i){if(void 0!==this.options.value){var o=this.options.scaling.customScalingFunction(t,e,i,this.options.value),n=this.options.scaling.max-this.options.scaling.min;if(!0===this.options.scaling.label.enabled){var r=this.options.scaling.label.max-this.options.scaling.label.min;this.options.font.size=this.options.scaling.label.min+o*r;}this.options.width=this.options.scaling.min+o*n;}else this.options.width=this.baseWidth,this.options.font.size=this.baseFontSize;this._setInteractionWidths(),this.updateLabelModule();}},{key:"_setInteractionWidths",value:function(){"function"==typeof this.options.hoverWidth?this.edgeType.hoverWidth=this.options.hoverWidth(this.options.width):this.edgeType.hoverWidth=this.options.hoverWidth+this.options.width,"function"==typeof this.options.selectionWidth?this.edgeType.selectionWidth=this.options.selectionWidth(this.options.width):this.edgeType.selectionWidth=this.options.selectionWidth+this.options.width;}},{key:"draw",value:function(t){var e=this.getFormattingValues();if(!e.hidden){var i=this.edgeType.getViaNode();this.edgeType.drawLine(t,e,this.selected,this.hover,i),this.drawLabel(t,i);}}},{key:"drawArrows",value:function(t){var e=this.getFormattingValues();if(!e.hidden){var i=this.edgeType.getViaNode(),o={};this.edgeType.fromPoint=this.edgeType.from,this.edgeType.toPoint=this.edgeType.to,e.fromArrow&&(o.from=this.edgeType.getArrowData(t,"from",i,this.selected,this.hover,e),!1===e.arrowStrikethrough&&(this.edgeType.fromPoint=o.from.core),e.fromArrowSrc&&(o.from.image=this.imagelist.load(e.fromArrowSrc)),e.fromArrowImageWidth&&(o.from.imageWidth=e.fromArrowImageWidth),e.fromArrowImageHeight&&(o.from.imageHeight=e.fromArrowImageHeight)),e.toArrow&&(o.to=this.edgeType.getArrowData(t,"to",i,this.selected,this.hover,e),!1===e.arrowStrikethrough&&(this.edgeType.toPoint=o.to.core),e.toArrowSrc&&(o.to.image=this.imagelist.load(e.toArrowSrc)),e.toArrowImageWidth&&(o.to.imageWidth=e.toArrowImageWidth),e.toArrowImageHeight&&(o.to.imageHeight=e.toArrowImageHeight)),e.middleArrow&&(o.middle=this.edgeType.getArrowData(t,"middle",i,this.selected,this.hover,e),e.middleArrowSrc&&(o.middle.image=this.imagelist.load(e.middleArrowSrc)),e.middleArrowImageWidth&&(o.middle.imageWidth=e.middleArrowImageWidth),e.middleArrowImageHeight&&(o.middle.imageHeight=e.middleArrowImageHeight)),e.fromArrow&&this.edgeType.drawArrowHead(t,e,this.selected,this.hover,o.from),e.middleArrow&&this.edgeType.drawArrowHead(t,e,this.selected,this.hover,o.middle),e.toArrow&&this.edgeType.drawArrowHead(t,e,this.selected,this.hover,o.to);}}},{key:"drawLabel",value:function(t,e){if(void 0!==this.options.label){var i,o=this.from,n=this.to;if(this.labelModule.differentState(this.selected,this.hover)&&this.labelModule.getTextSize(t,this.selected,this.hover),o.id!=n.id){this.labelModule.pointToSelf=!1,i=this.edgeType.getPoint(.5,e),t.save();var r=this._getRotation(t);0!=r.angle&&(t.translate(r.x,r.y),t.rotate(r.angle)),this.labelModule.draw(t,i.x,i.y,this.selected,this.hover),t.restore();}else {this.labelModule.pointToSelf=!0;var s=qd(t,this.options.selfReference.angle,this.options.selfReference.size,o);i=this._pointOnCircle(s.x,s.y,this.options.selfReference.size,this.options.selfReference.angle),this.labelModule.draw(t,i.x,i.y,this.selected,this.hover);}}}},{key:"getItemsOnPoint",value:function(t){var e=[];if(this.labelModule.visible()){var i=this._getRotation();Wd(this.labelModule.getSize(),t,i)&&e.push({edgeId:this.id,labelId:0});}var o={left:t.x,top:t.y};return this.isOverlappingWith(o)&&e.push({edgeId:this.id}),e}},{key:"isOverlappingWith",value:function(t){if(this.connected){var e=this.from.x,i=this.from.y,o=this.to.x,n=this.to.y,r=t.left,s=t.top;return this.edgeType.getDistanceToEdge(e,i,o,n,r,s)<10}return !1}},{key:"_getRotation",value:function(t){var e=this.edgeType.getViaNode(),i=this.edgeType.getPoint(.5,e);void 0!==t&&this.labelModule.calculateLabelSize(t,this.selected,this.hover,i.x,i.y);var o={x:i.x,y:this.labelModule.size.yLine,angle:0};if(!this.labelModule.visible())return o;if("horizontal"===this.options.font.align)return o;var n=this.from.y-this.to.y,r=this.from.x-this.to.x,s=Math.atan2(n,r);return (s<-1&&r<0||s>0&&r<0)&&(s+=Math.PI),o.angle=s,o}},{key:"_pointOnCircle",value:function(t,e,i,o){return {x:t+i*Math.cos(o),y:e-i*Math.sin(o)}}},{key:"select",value:function(){this.selected=!0;}},{key:"unselect",value:function(){this.selected=!1;}},{key:"cleanup",value:function(){return this.edgeType.cleanup()}},{key:"remove",value:function(){this.cleanup(),this.disconnect(),delete this.body.edges[this.id];}},{key:"endPointsValid",value:function(){return void 0!==this.body.nodes[this.fromId]&&void 0!==this.body.nodes[this.toId]}}],[{key:"parseOptions",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},n=arguments.length>4&&void 0!==arguments[4]&&arguments[4],r=["endPointOffset","arrowStrikethrough","id","from","hidden","hoverWidth","labelHighlightBold","length","line","opacity","physics","scaling","selectionWidth","selfReferenceSize","selfReference","to","title","value","width","font","chosen","widthConstraint"];if(Fr(r,t,e,i),void 0!==e.endPointOffset&&void 0!==e.endPointOffset.from&&(Pd(e.endPointOffset.from)?t.endPointOffset.from=e.endPointOffset.from:(t.endPointOffset.from=void 0!==o.endPointOffset.from?o.endPointOffset.from:0,console.error("endPointOffset.from is not a valid number"))),void 0!==e.endPointOffset&&void 0!==e.endPointOffset.to&&(Pd(e.endPointOffset.to)?t.endPointOffset.to=e.endPointOffset.to:(t.endPointOffset.to=void 0!==o.endPointOffset.to?o.endPointOffset.to:0,console.error("endPointOffset.to is not a valid number"))),Vd(e.label)?t.label=e.label:Vd(t.label)||(t.label=void 0),Jr(t,e,"smooth",o),Jr(t,e,"shadow",o),Jr(t,e,"background",o),void 0!==e.dashes&&null!==e.dashes?t.dashes=e.dashes:!0===i&&null===e.dashes&&(t.dashes=ko(o.dashes)),void 0!==e.scaling&&null!==e.scaling?(void 0!==e.scaling.min&&(t.scaling.min=e.scaling.min),void 0!==e.scaling.max&&(t.scaling.max=e.scaling.max),Jr(t.scaling,e.scaling,"label",o.scaling)):!0===i&&null===e.scaling&&(t.scaling=ko(o.scaling)),void 0!==e.arrows&&null!==e.arrows)if("string"==typeof e.arrows){var s=e.arrows.toLowerCase();t.arrows.to.enabled=-1!=On(s).call(s,"to"),t.arrows.middle.enabled=-1!=On(s).call(s,"middle"),t.arrows.from.enabled=-1!=On(s).call(s,"from");}else {if("object"!==cr(e.arrows))throw new Error("The arrow newOptions can only be an object or a string. Refer to the documentation. You used:"+dc(e.arrows));Jr(t.arrows,e.arrows,"to",o.arrows),Jr(t.arrows,e.arrows,"middle",o.arrows),Jr(t.arrows,e.arrows,"from",o.arrows);}else !0===i&&null===e.arrows&&(t.arrows=ko(o.arrows));if(void 0!==e.color&&null!==e.color){var a=Pr(e.color)?{color:e.color,highlight:e.color,hover:e.color,inherit:!1,opacity:1}:e.color,h=t.color;if(n)Ar(h,o.color,!1,i);else for(var d in h)Object.prototype.hasOwnProperty.call(h,d)&&delete h[d];if(Pr(h))h.color=h,h.highlight=h,h.hover=h,h.inherit=!1,void 0===a.opacity&&(h.opacity=1);else {var l=!1;void 0!==a.color&&(h.color=a.color,l=!0),void 0!==a.highlight&&(h.highlight=a.highlight,l=!0),void 0!==a.hover&&(h.hover=a.hover,l=!0),void 0!==a.inherit&&(h.inherit=a.inherit),void 0!==a.opacity&&(h.opacity=Math.min(1,Math.max(0,a.opacity))),!0===l?h.inherit=!1:void 0===h.inherit&&(h.inherit="from");}}else !0===i&&null===e.color&&(t.color=Qr(o.color));!0===i&&null===e.font&&(t.font=Qr(o.font)),Object.prototype.hasOwnProperty.call(e,"selfReferenceSize")&&(console.warn("The selfReferenceSize property has been deprecated. Please use selfReference property instead. The selfReference can be set like thise selfReference:{size:30, angle:Math.PI / 4}"),t.selfReference.size=e.selfReferenceSize);}}]),t}(),su=function(){function t(e,i,o){var n,r=this;Kh(this,t),this.body=e,this.images=i,this.groups=o,this.body.functions.createEdge=Q(n=this.create).call(n,this),this.edgesListeners={add:function(t,e){r.add(e.items);},update:function(t,e){r.update(e.items);},remove:function(t,e){r.remove(e.items);}},this.options={},this.defaultOptions={arrows:{to:{enabled:!1,scaleFactor:1,type:"arrow"},middle:{enabled:!1,scaleFactor:1,type:"arrow"},from:{enabled:!1,scaleFactor:1,type:"arrow"}},endPointOffset:{from:0,to:0},arrowStrikethrough:!0,color:{color:"#848484",highlight:"#848484",hover:"#848484",inherit:"from",opacity:1},dashes:!1,font:{color:"#343434",size:14,face:"arial",background:"none",strokeWidth:2,strokeColor:"#ffffff",align:"horizontal",multi:!1,vadjust:0,bold:{mod:"bold"},boldital:{mod:"bold italic"},ital:{mod:"italic"},mono:{mod:"",size:15,face:"courier new",vadjust:2}},hidden:!1,hoverWidth:1.5,label:void 0,labelHighlightBold:!0,length:void 0,physics:!0,scaling:{min:1,max:15,label:{enabled:!0,min:14,max:30,maxVisible:30,drawThreshold:5},customScalingFunction:function(t,e,i,o){if(e===t)return .5;var n=1/(e-t);return Math.max(0,(o-t)*n)}},selectionWidth:1.5,selfReference:{size:20,angle:Math.PI/4,renderBehindTheNode:!0},shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:10,x:5,y:5},background:{enabled:!1,color:"rgba(111,111,111,1)",size:10,dashes:!1},smooth:{enabled:!0,type:"dynamic",forceDirection:"none",roundness:.5},title:void 0,width:1,value:void 0},Ar(this.options,this.defaultOptions),this.bindEventListeners();}return Zh(t,[{key:"bindEventListeners",value:function(){var t,e,i=this;this.body.emitter.on("_forceDisableDynamicCurves",(function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];"dynamic"===t&&(t="continuous");var o=!1;for(var n in i.body.edges)if(Object.prototype.hasOwnProperty.call(i.body.edges,n)){var r=i.body.edges[n],s=i.body.data.edges.get(n);if(null!=s){var a=s.smooth;void 0!==a&&!0===a.enabled&&"dynamic"===a.type&&(void 0===t?r.setOptions({smooth:!1}):r.setOptions({smooth:{type:t}}),o=!0);}}!0===e&&!0===o&&i.body.emitter.emit("_dataChanged");})),this.body.emitter.on("_dataUpdated",(function(){i.reconnectEdges();})),this.body.emitter.on("refreshEdges",Q(t=this.refresh).call(t,this)),this.body.emitter.on("refresh",Q(e=this.refresh).call(e,this)),this.body.emitter.on("destroy",(function(){Hr(i.edgesListeners,(function(t,e){i.body.data.edges&&i.body.data.edges.off(e,t);})),delete i.body.functions.createEdge,delete i.edgesListeners.add,delete i.edgesListeners.update,delete i.edgesListeners.remove,delete i.edgesListeners;}));}},{key:"setOptions",value:function(t){if(void 0!==t){ru.parseOptions(this.options,t,!0,this.defaultOptions,!0);var e=!1;if(void 0!==t.smooth)for(var i in this.body.edges)Object.prototype.hasOwnProperty.call(this.body.edges,i)&&(e=this.body.edges[i].updateEdgeType()||e);if(void 0!==t.font)for(var o in this.body.edges)Object.prototype.hasOwnProperty.call(this.body.edges,o)&&this.body.edges[o].updateLabelModule();void 0===t.hidden&&void 0===t.physics&&!0!==e||this.body.emitter.emit("_dataChanged");}}},{key:"setData",value:function(t){var i=this,o=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=this.body.data.edges;if(e.isDataViewLike("id",t))this.body.data.edges=t;else if(dr(t))this.body.data.edges=new e.DataSet,this.body.data.edges.add(t);else {if(t)throw new TypeError("Array or DataSet expected");this.body.data.edges=new e.DataSet;}if(n&&Hr(this.edgesListeners,(function(t,e){n.off(e,t);})),this.body.edges={},this.body.data.edges){Hr(this.edgesListeners,(function(t,e){i.body.data.edges.on(e,t);}));var r=this.body.data.edges.getIds();this.add(r,!0);}this.body.emitter.emit("_adjustEdgesForHierarchicalLayout"),!1===o&&this.body.emitter.emit("_dataChanged");}},{key:"add",value:function(t){for(var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=this.body.edges,o=this.body.data.edges,n=0;n<t.length;n++){var r=t[n],s=i[r];s&&s.disconnect();var a=o.get(r,{showInternalIds:!0});i[r]=this.create(a);}this.body.emitter.emit("_adjustEdgesForHierarchicalLayout"),!1===e&&this.body.emitter.emit("_dataChanged");}},{key:"update",value:function(t){for(var e=this.body.edges,i=this.body.data.edges,o=!1,n=0;n<t.length;n++){var r=t[n],s=i.get(r),a=e[r];void 0!==a?(a.disconnect(),o=a.setOptions(s)||o,a.connect()):(this.body.edges[r]=this.create(s),o=!0);}!0===o?(this.body.emitter.emit("_adjustEdgesForHierarchicalLayout"),this.body.emitter.emit("_dataChanged")):this.body.emitter.emit("_dataUpdated");}},{key:"remove",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(0!==t.length){var i=this.body.edges;Hr(t,(function(t){var e=i[t];void 0!==e&&e.remove();})),e&&this.body.emitter.emit("_dataChanged");}}},{key:"refresh",value:function(){var t=this;Hr(this.body.edges,(function(e,i){var o=t.body.data.edges.get(i);void 0!==o&&e.setOptions(o);}));}},{key:"create",value:function(t){return new ru(t,this.body,this.images,this.options,this.defaultOptions)}},{key:"reconnectEdges",value:function(){var t,e=this.body.nodes,i=this.body.edges;for(t in e)Object.prototype.hasOwnProperty.call(e,t)&&(e[t].edges=[]);for(t in i)if(Object.prototype.hasOwnProperty.call(i,t)){var o=i[t];o.from=null,o.to=null,o.connect();}}},{key:"getConnectedNodes",value:function(t){var e=[];if(void 0!==this.body.edges[t]){var i=this.body.edges[t];void 0!==i.fromId&&e.push(i.fromId),void 0!==i.toId&&e.push(i.toId);}return e}},{key:"_updateState",value:function(){this._addMissingEdges(),this._removeInvalidEdges();}},{key:"_removeInvalidEdges",value:function(){var t=this,e=[];Hr(this.body.edges,(function(i,o){var n=t.body.nodes[i.toId],r=t.body.nodes[i.fromId];void 0!==n&&!0===n.isCluster||void 0!==r&&!0===r.isCluster||void 0!==n&&void 0!==r||e.push(o);})),this.remove(e,!1);}},{key:"_addMissingEdges",value:function(){var t=this.body.data.edges;if(null!=t){var e=this.body.edges,i=[];qo(t).call(t,(function(t,o){void 0===e[o]&&i.push(o);})),this.add(i,!0);}}}]),t}(),au=function(){function t(e,i,o){Kh(this,t),this.body=e,this.physicsBody=i,this.barnesHutTree,this.setOptions(o),this._rng=xr("BARNES HUT SOLVER");}return Zh(t,[{key:"setOptions",value:function(t){this.options=t,this.thetaInversed=1/this.options.theta,this.overlapAvoidanceFactor=1-Math.max(0,Math.min(1,this.options.avoidOverlap));}},{key:"solve",value:function(){if(0!==this.options.gravitationalConstant&&this.physicsBody.physicsNodeIndices.length>0){var t,e=this.body.nodes,i=this.physicsBody.physicsNodeIndices,o=i.length,n=this._formBarnesHutTree(e,i);this.barnesHutTree=n;for(var r=0;r<o;r++)(t=e[i[r]]).options.mass>0&&this._getForceContributions(n.root,t);}}},{key:"_getForceContributions",value:function(t,e){this._getForceContribution(t.children.NW,e),this._getForceContribution(t.children.NE,e),this._getForceContribution(t.children.SW,e),this._getForceContribution(t.children.SE,e);}},{key:"_getForceContribution",value:function(t,e){if(t.childrenCount>0){var i=t.centerOfMass.x-e.x,o=t.centerOfMass.y-e.y,n=Math.sqrt(i*i+o*o);n*t.calcSize>this.thetaInversed?this._calculateForces(n,i,o,e,t):4===t.childrenCount?this._getForceContributions(t,e):t.children.data.id!=e.id&&this._calculateForces(n,i,o,e,t);}}},{key:"_calculateForces",value:function(t,e,i,o,n){0===t&&(e=t=.1),this.overlapAvoidanceFactor<1&&o.shape.radius&&(t=Math.max(.1+this.overlapAvoidanceFactor*o.shape.radius,t-o.shape.radius));var r=this.options.gravitationalConstant*n.mass*o.options.mass/Math.pow(t,3),s=e*r,a=i*r;this.physicsBody.forces[o.id].x+=s,this.physicsBody.forces[o.id].y+=a;}},{key:"_formBarnesHutTree",value:function(t,e){for(var i,o=e.length,n=t[e[0]].x,r=t[e[0]].y,s=t[e[0]].x,a=t[e[0]].y,h=1;h<o;h++){var d=t[e[h]],l=d.x,c=d.y;d.options.mass>0&&(l<n&&(n=l),l>s&&(s=l),c<r&&(r=c),c>a&&(a=c));}var u=Math.abs(s-n)-Math.abs(a-r);u>0?(r-=.5*u,a+=.5*u):(n+=.5*u,s-=.5*u);var f=Math.max(1e-5,Math.abs(s-n)),p=.5*f,v=.5*(n+s),g=.5*(r+a),y={root:{centerOfMass:{x:0,y:0},mass:0,range:{minX:v-p,maxX:v+p,minY:g-p,maxY:g+p},size:f,calcSize:1/f,children:{data:null},maxWidth:0,level:0,childrenCount:4}};this._splitBranch(y.root);for(var m=0;m<o;m++)(i=t[e[m]]).options.mass>0&&this._placeInTree(y.root,i);return y}},{key:"_updateBranchMass",value:function(t,e){var i=t.centerOfMass,o=t.mass+e.options.mass,n=1/o;i.x=i.x*t.mass+e.x*e.options.mass,i.x*=n,i.y=i.y*t.mass+e.y*e.options.mass,i.y*=n,t.mass=o;var r=Math.max(Math.max(e.height,e.radius),e.width);t.maxWidth=t.maxWidth<r?r:t.maxWidth;}},{key:"_placeInTree",value:function(t,e,i){1==i&&void 0!==i||this._updateBranchMass(t,e);var o,n=t.children.NW.range;o=n.maxX>e.x?n.maxY>e.y?"NW":"SW":n.maxY>e.y?"NE":"SE",this._placeInRegion(t,e,o);}},{key:"_placeInRegion",value:function(t,e,i){var o=t.children[i];switch(o.childrenCount){case 0:o.children.data=e,o.childrenCount=1,this._updateBranchMass(o,e);break;case 1:o.children.data.x===e.x&&o.children.data.y===e.y?(e.x+=this._rng(),e.y+=this._rng()):(this._splitBranch(o),this._placeInTree(o,e));break;case 4:this._placeInTree(o,e);}}},{key:"_splitBranch",value:function(t){var e=null;1===t.childrenCount&&(e=t.children.data,t.mass=0,t.centerOfMass.x=0,t.centerOfMass.y=0),t.childrenCount=4,t.children.data=null,this._insertRegion(t,"NW"),this._insertRegion(t,"NE"),this._insertRegion(t,"SW"),this._insertRegion(t,"SE"),null!=e&&this._placeInTree(t,e);}},{key:"_insertRegion",value:function(t,e){var i,o,n,r,s=.5*t.size;switch(e){case"NW":i=t.range.minX,o=t.range.minX+s,n=t.range.minY,r=t.range.minY+s;break;case"NE":i=t.range.minX+s,o=t.range.maxX,n=t.range.minY,r=t.range.minY+s;break;case"SW":i=t.range.minX,o=t.range.minX+s,n=t.range.minY+s,r=t.range.maxY;break;case"SE":i=t.range.minX+s,o=t.range.maxX,n=t.range.minY+s,r=t.range.maxY;}t.children[e]={centerOfMass:{x:0,y:0},mass:0,range:{minX:i,maxX:o,minY:n,maxY:r},size:.5*t.size,calcSize:2*t.calcSize,children:{data:null},maxWidth:0,level:t.level+1,childrenCount:0};}},{key:"_debug",value:function(t,e){void 0!==this.barnesHutTree&&(t.lineWidth=1,this._drawBranch(this.barnesHutTree.root,t,e));}},{key:"_drawBranch",value:function(t,e,i){void 0===i&&(i="#FF0000"),4===t.childrenCount&&(this._drawBranch(t.children.NW,e),this._drawBranch(t.children.NE,e),this._drawBranch(t.children.SE,e),this._drawBranch(t.children.SW,e)),e.strokeStyle=i,e.beginPath(),e.moveTo(t.range.minX,t.range.minY),e.lineTo(t.range.maxX,t.range.minY),e.stroke(),e.beginPath(),e.moveTo(t.range.maxX,t.range.minY),e.lineTo(t.range.maxX,t.range.maxY),e.stroke(),e.beginPath(),e.moveTo(t.range.maxX,t.range.maxY),e.lineTo(t.range.minX,t.range.maxY),e.stroke(),e.beginPath(),e.moveTo(t.range.minX,t.range.maxY),e.lineTo(t.range.minX,t.range.minY),e.stroke();}}]),t}(),hu=function(){function t(e,i,o){Kh(this,t),this._rng=xr("REPULSION SOLVER"),this.body=e,this.physicsBody=i,this.setOptions(o);}return Zh(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,o,n,r,s,a,h=this.body.nodes,d=this.physicsBody.physicsNodeIndices,l=this.physicsBody.forces,c=this.options.nodeDistance,u=-2/3/c,f=0;f<d.length-1;f++){s=h[d[f]];for(var p=f+1;p<d.length;p++)t=(a=h[d[p]]).x-s.x,e=a.y-s.y,0===(i=Math.sqrt(t*t+e*e))&&(t=i=.1*this._rng()),i<2*c&&(r=i<.5*c?1:u*i+1.3333333333333333,o=t*(r/=i),n=e*r,l[s.id].x-=o,l[s.id].y-=n,l[a.id].x+=o,l[a.id].y+=n);}}}]),t}(),du=function(){function t(e,i,o){Kh(this,t),this.body=e,this.physicsBody=i,this.setOptions(o);}return Zh(t,[{key:"setOptions",value:function(t){this.options=t,this.overlapAvoidanceFactor=Math.max(0,Math.min(1,this.options.avoidOverlap||0));}},{key:"solve",value:function(){for(var t=this.body.nodes,e=this.physicsBody.physicsNodeIndices,i=this.physicsBody.forces,o=this.options.nodeDistance,n=0;n<e.length-1;n++)for(var r=t[e[n]],s=n+1;s<e.length;s++){var a=t[e[s]];if(r.level===a.level){var h=o+this.overlapAvoidanceFactor*((r.shape.radius||0)/2+(a.shape.radius||0)/2),d=a.x-r.x,l=a.y-r.y,c=Math.sqrt(d*d+l*l),u=void 0;u=c<h?-Math.pow(.05*c,2)+Math.pow(.05*h,2):0,0!==c&&(u/=c);var f=d*u,p=l*u;i[r.id].x-=f,i[r.id].y-=p,i[a.id].x+=f,i[a.id].y+=p;}}}}]),t}(),lu=function(){function t(e,i,o){Kh(this,t),this.body=e,this.physicsBody=i,this.setOptions(o);}return Zh(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,o,n,r=this.physicsBody.physicsEdgeIndices,s=this.body.edges,a=0;a<r.length;a++)!0===(e=s[r[a]]).connected&&e.toId!==e.fromId&&void 0!==this.body.nodes[e.toId]&&void 0!==this.body.nodes[e.fromId]&&(void 0!==e.edgeType.via?(t=void 0===e.options.length?this.options.springLength:e.options.length,i=e.to,o=e.edgeType.via,n=e.from,this._calculateSpringForce(i,o,.5*t),this._calculateSpringForce(o,n,.5*t)):(t=void 0===e.options.length?1.5*this.options.springLength:e.options.length,this._calculateSpringForce(e.from,e.to,t)));}},{key:"_calculateSpringForce",value:function(t,e,i){var o=t.x-e.x,n=t.y-e.y,r=Math.max(Math.sqrt(o*o+n*n),.01),s=this.options.springConstant*(i-r)/r,a=o*s,h=n*s;void 0!==this.physicsBody.forces[t.id]&&(this.physicsBody.forces[t.id].x+=a,this.physicsBody.forces[t.id].y+=h),void 0!==this.physicsBody.forces[e.id]&&(this.physicsBody.forces[e.id].x-=a,this.physicsBody.forces[e.id].y-=h);}}]),t}(),cu=function(){function t(e,i,o){Kh(this,t),this.body=e,this.physicsBody=i,this.setOptions(o);}return Zh(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,o,n,r,s,a,h,d,l=this.body.edges,c=.5,u=this.physicsBody.physicsEdgeIndices,f=this.physicsBody.physicsNodeIndices,p=this.physicsBody.forces,v=0;v<f.length;v++){var g=f[v];p[g].springFx=0,p[g].springFy=0;}for(var y=0;y<u.length;y++)!0===(e=l[u[y]]).connected&&(t=void 0===e.options.length?this.options.springLength:e.options.length,i=e.from.x-e.to.x,o=e.from.y-e.to.y,a=0===(a=Math.sqrt(i*i+o*o))?.01:a,n=i*(s=this.options.springConstant*(t-a)/a),r=o*s,e.to.level!=e.from.level?(void 0!==p[e.toId]&&(p[e.toId].springFx-=n,p[e.toId].springFy-=r),void 0!==p[e.fromId]&&(p[e.fromId].springFx+=n,p[e.fromId].springFy+=r)):(void 0!==p[e.toId]&&(p[e.toId].x-=c*n,p[e.toId].y-=c*r),void 0!==p[e.fromId]&&(p[e.fromId].x+=c*n,p[e.fromId].y+=c*r)));s=1;for(var m=0;m<f.length;m++){var b=f[m];h=Math.min(s,Math.max(-s,p[b].springFx)),d=Math.min(s,Math.max(-s,p[b].springFy)),p[b].x+=h,p[b].y+=d;}for(var w=0,k=0,_=0;_<f.length;_++){var x=f[_];w+=p[x].x,k+=p[x].y;}for(var E=w/f.length,O=k/f.length,C=0;C<f.length;C++){var S=f[C];p[S].x-=E,p[S].y-=O;}}}]),t}(),uu=function(){function t(e,i,o){Kh(this,t),this.body=e,this.physicsBody=i,this.setOptions(o);}return Zh(t,[{key:"setOptions",value:function(t){this.options=t;}},{key:"solve",value:function(){for(var t,e,i,o,n=this.body.nodes,r=this.physicsBody.physicsNodeIndices,s=this.physicsBody.forces,a=0;a<r.length;a++){t=-(o=n[r[a]]).x,e=-o.y,i=Math.sqrt(t*t+e*e),this._calculateForces(i,t,e,s,o);}}},{key:"_calculateForces",value:function(t,e,i,o,n){var r=0===t?0:this.options.centralGravity/t;o[n.id].x=e*r,o[n.id].y=i*r;}}]),t}();function fu(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var pu=function(t){dl(i,t);var e=fu(i);function i(t,o,n){var r;return Kh(this,i),(r=e.call(this,t,o,n))._rng=xr("FORCE ATLAS 2 BASED REPULSION SOLVER"),r}return Zh(i,[{key:"_calculateForces",value:function(t,e,i,o,n){0===t&&(e=t=.1*this._rng()),this.overlapAvoidanceFactor<1&&o.shape.radius&&(t=Math.max(.1+this.overlapAvoidanceFactor*o.shape.radius,t-o.shape.radius));var r=o.edges.length+1,s=this.options.gravitationalConstant*n.mass*o.options.mass*r/Math.pow(t,2),a=e*s,h=i*s;this.physicsBody.forces[o.id].x+=a,this.physicsBody.forces[o.id].y+=h;}}]),i}(au);function vu(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var gu=function(t){dl(i,t);var e=vu(i);function i(t,o,n){return Kh(this,i),e.call(this,t,o,n)}return Zh(i,[{key:"_calculateForces",value:function(t,e,i,o,n){if(t>0){var r=n.edges.length+1,s=this.options.centralGravity*r*n.options.mass;o[n.id].x=e*s,o[n.id].y=i*s;}}}]),i}(uu),yu=function(){function t(e){Kh(this,t),this.body=e,this.physicsBody={physicsNodeIndices:[],physicsEdgeIndices:[],forces:{},velocities:{}},this.physicsEnabled=!0,this.simulationInterval=1e3/60,this.requiresTimeout=!0,this.previousStates={},this.referenceState={},this.freezeCache={},this.renderTimer=void 0,this.adaptiveTimestep=!1,this.adaptiveTimestepEnabled=!1,this.adaptiveCounter=0,this.adaptiveInterval=3,this.stabilized=!1,this.startedStabilization=!1,this.stabilizationIterations=0,this.ready=!1,this.options={},this.defaultOptions={enabled:!0,barnesHut:{theta:.5,gravitationalConstant:-2e3,centralGravity:.3,springLength:95,springConstant:.04,damping:.09,avoidOverlap:0},forceAtlas2Based:{theta:.5,gravitationalConstant:-50,centralGravity:.01,springConstant:.08,springLength:100,damping:.4,avoidOverlap:0},repulsion:{centralGravity:.2,springLength:200,springConstant:.05,nodeDistance:100,damping:.09,avoidOverlap:0},hierarchicalRepulsion:{centralGravity:0,springLength:100,springConstant:.01,nodeDistance:120,damping:.09},maxVelocity:50,minVelocity:.75,solver:"barnesHut",stabilization:{enabled:!0,iterations:1e3,updateInterval:50,onlyDynamicEdges:!1,fit:!0},timestep:.5,adaptiveTimestep:!0,wind:{x:0,y:0}},bt(this.options,this.defaultOptions),this.timestep=.5,this.layoutFailed=!1,this.bindEventListeners();}return Zh(t,[{key:"bindEventListeners",value:function(){var t=this;this.body.emitter.on("initPhysics",(function(){t.initPhysics();})),this.body.emitter.on("_layoutFailed",(function(){t.layoutFailed=!0;})),this.body.emitter.on("resetPhysics",(function(){t.stopSimulation(),t.ready=!1;})),this.body.emitter.on("disablePhysics",(function(){t.physicsEnabled=!1,t.stopSimulation();})),this.body.emitter.on("restorePhysics",(function(){t.setOptions(t.options),!0===t.ready&&t.startSimulation();})),this.body.emitter.on("startSimulation",(function(){!0===t.ready&&t.startSimulation();})),this.body.emitter.on("stopSimulation",(function(){t.stopSimulation();})),this.body.emitter.on("destroy",(function(){t.stopSimulation(!1),t.body.emitter.off();})),this.body.emitter.on("_dataChanged",(function(){t.updatePhysicsData();}));}},{key:"setOptions",value:function(t){if(void 0!==t)if(!1===t)this.options.enabled=!1,this.physicsEnabled=!1,this.stopSimulation();else if(!0===t)this.options.enabled=!0,this.physicsEnabled=!0,this.startSimulation();else {this.physicsEnabled=!0,Nr(["stabilization"],this.options,t),Jr(this.options,t,"stabilization"),void 0===t.enabled&&(this.options.enabled=!0),!1===this.options.enabled&&(this.physicsEnabled=!1,this.stopSimulation());var e=this.options.wind;e&&(("number"!=typeof e.x||Id(e.x))&&(e.x=0),("number"!=typeof e.y||Id(e.y))&&(e.y=0)),this.timestep=this.options.timestep;}this.init();}},{key:"init",value:function(){var t;"forceAtlas2Based"===this.options.solver?(t=this.options.forceAtlas2Based,this.nodesSolver=new pu(this.body,this.physicsBody,t),this.edgesSolver=new lu(this.body,this.physicsBody,t),this.gravitySolver=new gu(this.body,this.physicsBody,t)):"repulsion"===this.options.solver?(t=this.options.repulsion,this.nodesSolver=new hu(this.body,this.physicsBody,t),this.edgesSolver=new lu(this.body,this.physicsBody,t),this.gravitySolver=new uu(this.body,this.physicsBody,t)):"hierarchicalRepulsion"===this.options.solver?(t=this.options.hierarchicalRepulsion,this.nodesSolver=new du(this.body,this.physicsBody,t),this.edgesSolver=new cu(this.body,this.physicsBody,t),this.gravitySolver=new uu(this.body,this.physicsBody,t)):(t=this.options.barnesHut,this.nodesSolver=new au(this.body,this.physicsBody,t),this.edgesSolver=new lu(this.body,this.physicsBody,t),this.gravitySolver=new uu(this.body,this.physicsBody,t)),this.modelOptions=t;}},{key:"initPhysics",value:function(){!0===this.physicsEnabled&&!0===this.options.enabled?!0===this.options.stabilization.enabled?this.stabilize():(this.stabilized=!1,this.ready=!0,this.body.emitter.emit("fit",{},this.layoutFailed),this.startSimulation()):(this.ready=!0,this.body.emitter.emit("fit"));}},{key:"startSimulation",value:function(){var t;!0===this.physicsEnabled&&!0===this.options.enabled?(this.stabilized=!1,this.adaptiveTimestep=!1,this.body.emitter.emit("_resizeNodes"),void 0===this.viewFunction&&(this.viewFunction=Q(t=this.simulationStep).call(t,this),this.body.emitter.on("initRedraw",this.viewFunction),this.body.emitter.emit("_startRendering"))):this.body.emitter.emit("_redraw");}},{key:"stopSimulation",value:function(){var t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.stabilized=!0,!0===t&&this._emitStabilized(),void 0!==this.viewFunction&&(this.body.emitter.off("initRedraw",this.viewFunction),this.viewFunction=void 0,!0===t&&this.body.emitter.emit("_stopRendering"));}},{key:"simulationStep",value:function(){var t=tr();this.physicsTick(),(tr()-t<.4*this.simulationInterval||!0===this.runDoubleSpeed)&&!1===this.stabilized&&(this.physicsTick(),this.runDoubleSpeed=!0),!0===this.stabilized&&this.stopSimulation();}},{key:"_emitStabilized",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.stabilizationIterations;(this.stabilizationIterations>1||!0===this.startedStabilization)&&_d((function(){t.body.emitter.emit("stabilized",{iterations:e}),t.startedStabilization=!1,t.stabilizationIterations=0;}),0);}},{key:"physicsStep",value:function(){this.gravitySolver.solve(),this.nodesSolver.solve(),this.edgesSolver.solve(),this.moveNodes();}},{key:"adjustTimeStep",value:function(){!0===this._evaluateStepQuality()?this.timestep=1.2*this.timestep:this.timestep/1.2<this.options.timestep?this.timestep=this.options.timestep:(this.adaptiveCounter=-1,this.timestep=Math.max(this.options.timestep,this.timestep/1.2));}},{key:"physicsTick",value:function(){if(this._startStabilizing(),!0!==this.stabilized){if(!0===this.adaptiveTimestep&&!0===this.adaptiveTimestepEnabled)this.adaptiveCounter%this.adaptiveInterval==0?(this.timestep=2*this.timestep,this.physicsStep(),this.revert(),this.timestep=.5*this.timestep,this.physicsStep(),this.physicsStep(),this.adjustTimeStep()):this.physicsStep(),this.adaptiveCounter+=1;else this.timestep=this.options.timestep,this.physicsStep();!0===this.stabilized&&this.revert(),this.stabilizationIterations++;}}},{key:"updatePhysicsData",value:function(){this.physicsBody.forces={},this.physicsBody.physicsNodeIndices=[],this.physicsBody.physicsEdgeIndices=[];var t=this.body.nodes,e=this.body.edges;for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&!0===t[i].options.physics&&this.physicsBody.physicsNodeIndices.push(t[i].id);for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&!0===e[o].options.physics&&this.physicsBody.physicsEdgeIndices.push(e[o].id);for(var n=0;n<this.physicsBody.physicsNodeIndices.length;n++){var r=this.physicsBody.physicsNodeIndices[n];this.physicsBody.forces[r]={x:0,y:0},void 0===this.physicsBody.velocities[r]&&(this.physicsBody.velocities[r]={x:0,y:0});}for(var s in this.physicsBody.velocities)void 0===t[s]&&delete this.physicsBody.velocities[s];}},{key:"revert",value:function(){var t=ir(this.previousStates),e=this.body.nodes,i=this.physicsBody.velocities;this.referenceState={};for(var o=0;o<t.length;o++){var n=t[o];void 0!==e[n]?!0===e[n].options.physics&&(this.referenceState[n]={positions:{x:e[n].x,y:e[n].y}},i[n].x=this.previousStates[n].vx,i[n].y=this.previousStates[n].vy,e[n].x=this.previousStates[n].x,e[n].y=this.previousStates[n].y):delete this.previousStates[n];}}},{key:"_evaluateStepQuality",value:function(){var t,e,i=this.body.nodes,o=this.referenceState;for(var n in this.referenceState)if(Object.prototype.hasOwnProperty.call(this.referenceState,n)&&void 0!==i[n]&&(t=i[n].x-o[n].positions.x,e=i[n].y-o[n].positions.y,Math.sqrt(Math.pow(t,2)+Math.pow(e,2))>.3))return !1;return !0}},{key:"moveNodes",value:function(){for(var t=this.physicsBody.physicsNodeIndices,e=0,i=0,o=0;o<t.length;o++){var n=t[o],r=this._performStep(n);e=Math.max(e,r),i+=r;}this.adaptiveTimestepEnabled=i/t.length<5,this.stabilized=e<this.options.minVelocity;}},{key:"calculateComponentVelocity",value:function(t,e,i){t+=(e-this.modelOptions.damping*t)/i*this.timestep;var o=this.options.maxVelocity||1e9;return Math.abs(t)>o&&(t=t>0?o:-o),t}},{key:"_performStep",value:function(t){var e=this.body.nodes[t],i=this.physicsBody.forces[t];this.options.wind&&(i.x+=this.options.wind.x,i.y+=this.options.wind.y);var o=this.physicsBody.velocities[t];return this.previousStates[t]={x:e.x,y:e.y,vx:o.x,vy:o.y},!1===e.options.fixed.x?(o.x=this.calculateComponentVelocity(o.x,i.x,e.options.mass),e.x+=o.x*this.timestep):(i.x=0,o.x=0),!1===e.options.fixed.y?(o.y=this.calculateComponentVelocity(o.y,i.y,e.options.mass),e.y+=o.y*this.timestep):(i.y=0,o.y=0),Math.sqrt(Math.pow(o.x,2)+Math.pow(o.y,2))}},{key:"_freezeNodes",value:function(){var t=this.body.nodes;for(var e in t)if(Object.prototype.hasOwnProperty.call(t,e)&&t[e].x&&t[e].y){var i=t[e].options.fixed;this.freezeCache[e]={x:i.x,y:i.y},i.x=!0,i.y=!0;}}},{key:"_restoreFrozenNodes",value:function(){var t=this.body.nodes;for(var e in t)Object.prototype.hasOwnProperty.call(t,e)&&void 0!==this.freezeCache[e]&&(t[e].options.fixed.x=this.freezeCache[e].x,t[e].options.fixed.y=this.freezeCache[e].y);this.freezeCache={};}},{key:"stabilize",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.options.stabilization.iterations;"number"!=typeof e&&(e=this.options.stabilization.iterations,console.error("The stabilize method needs a numeric amount of iterations. Switching to default: ",e)),0!==this.physicsBody.physicsNodeIndices.length?(this.adaptiveTimestep=this.options.adaptiveTimestep,this.body.emitter.emit("_resizeNodes"),this.stopSimulation(),this.stabilized=!1,this.body.emitter.emit("_blockRedraw"),this.targetIterations=e,!0===this.options.stabilization.onlyDynamicEdges&&this._freezeNodes(),this.stabilizationIterations=0,_d((function(){return t._stabilizationBatch()}),0)):this.ready=!0;}},{key:"_startStabilizing",value:function(){return !0!==this.startedStabilization&&(this.body.emitter.emit("startStabilizing"),this.startedStabilization=!0,!0)}},{key:"_stabilizationBatch",value:function(){var t=this,e=function(){return !1===t.stabilized&&t.stabilizationIterations<t.targetIterations},i=function(){t.body.emitter.emit("stabilizationProgress",{iterations:t.stabilizationIterations,total:t.targetIterations});};this._startStabilizing()&&i();for(var o,n=0;e()&&n<this.options.stabilization.updateInterval;)this.physicsTick(),n++;(i(),e())?_d(Q(o=this._stabilizationBatch).call(o,this),0):this._finalizeStabilization();}},{key:"_finalizeStabilization",value:function(){this.body.emitter.emit("_allowRedraw"),!0===this.options.stabilization.fit&&this.body.emitter.emit("fit"),!0===this.options.stabilization.onlyDynamicEdges&&this._restoreFrozenNodes(),this.body.emitter.emit("stabilizationIterationsDone"),this.body.emitter.emit("_requestRedraw"),!0===this.stabilized?this._emitStabilized():this.startSimulation(),this.ready=!0;}},{key:"_drawForces",value:function(t){for(var e=0;e<this.physicsBody.physicsNodeIndices.length;e++){var i=this.physicsBody.physicsNodeIndices[e],o=this.body.nodes[i],n=this.physicsBody.forces[i],r=Math.sqrt(Math.pow(n.x,2)+Math.pow(n.x,2)),s=Math.min(Math.max(5,r),15),a=3*s,h=Gr((180-180*Math.min(1,Math.max(0,.03*r)))/360,1,1),d={x:o.x+20*n.x,y:o.y+20*n.y};t.lineWidth=s,t.strokeStyle=h,t.beginPath(),t.moveTo(o.x,o.y),t.lineTo(d.x,d.y),t.stroke();var l=Math.atan2(n.y,n.x);t.fillStyle=h,Wc.draw(t,{type:"arrow",point:d,angle:l,length:a}),gl(t).call(t);}}}]),t}(),mu=[].reverse,bu=[1,2];q({target:"Array",proto:!0,forced:String(bu)===String(bu.reverse())},{reverse:function(){return Ut(this)&&(this.length=this.length),mu.call(this)}});var wu=K("Array").reverse,ku=Array.prototype,_u=function(t){var e=t.reverse;return t===ku||t instanceof Array&&e===ku.reverse?wu:e},xu="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto),Eu=new Uint8Array(16);function Ou(){if(!xu)throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return xu(Eu)}var Cu=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;function Su(t){return "string"==typeof t&&Cu.test(t)}for(var Tu=[],Mu=0;Mu<256;++Mu)Tu.push((Mu+256).toString(16).substr(1));function Du(t,e,i){var o=(t=t||{}).random||(t.rng||Ou)();if(o[6]=15&o[6]|64,o[8]=63&o[8]|128,e){i=i||0;for(var n=0;n<16;++n)e[i+n]=o[n];return e}return function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,i=(Tu[t[e+0]]+Tu[t[e+1]]+Tu[t[e+2]]+Tu[t[e+3]]+"-"+Tu[t[e+4]]+Tu[t[e+5]]+"-"+Tu[t[e+6]]+Tu[t[e+7]]+"-"+Tu[t[e+8]]+Tu[t[e+9]]+"-"+Tu[t[e+10]]+Tu[t[e+11]]+Tu[t[e+12]]+Tu[t[e+13]]+Tu[t[e+14]]+Tu[t[e+15]]).toLowerCase();if(!Su(i))throw TypeError("Stringified UUID is invalid");return i}(o)}var Pu=function(){function t(){Kh(this,t);}return Zh(t,null,[{key:"getRange",value:function(t){var e,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],o=1e9,n=-1e9,r=1e9,s=-1e9;if(i.length>0)for(var a=0;a<i.length;a++)r>(e=t[i[a]]).shape.boundingBox.left&&(r=e.shape.boundingBox.left),s<e.shape.boundingBox.right&&(s=e.shape.boundingBox.right),o>e.shape.boundingBox.top&&(o=e.shape.boundingBox.top),n<e.shape.boundingBox.bottom&&(n=e.shape.boundingBox.bottom);return 1e9===r&&-1e9===s&&1e9===o&&-1e9===n&&(o=0,n=0,r=0,s=0),{minX:r,maxX:s,minY:o,maxY:n}}},{key:"getRangeCore",value:function(t){var e,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],o=1e9,n=-1e9,r=1e9,s=-1e9;if(i.length>0)for(var a=0;a<i.length;a++)r>(e=t[i[a]]).x&&(r=e.x),s<e.x&&(s=e.x),o>e.y&&(o=e.y),n<e.y&&(n=e.y);return 1e9===r&&-1e9===s&&1e9===o&&-1e9===n&&(o=0,n=0,r=0,s=0),{minX:r,maxX:s,minY:o,maxY:n}}},{key:"findCenter",value:function(t){return {x:.5*(t.maxX+t.minX),y:.5*(t.maxY+t.minY)}}},{key:"cloneOptions",value:function(t,e){var i={};return void 0===e||"node"===e?(Ar(i,t.options,!0),i.x=t.x,i.y=t.y,i.amountOfConnections=t.edges.length):Ar(i,t.options,!0),i}}]),t}();function Iu(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var zu=function(t){dl(i,t);var e=Iu(i);function i(t,o,n,r,s,a){var h;return Kh(this,i),(h=e.call(this,t,o,n,r,s,a)).isCluster=!0,h.containedNodes={},h.containedEdges={},h}return Zh(i,[{key:"_openChildCluster",value:function(t){var e=this,i=this.body.nodes[t];if(void 0===this.containedNodes[t])throw new Error("node with id: "+t+" not in current cluster");if(!i.isCluster)throw new Error("node with id: "+t+" is not a cluster");delete this.containedNodes[t],Hr(i.edges,(function(t){delete e.containedEdges[t.id];})),Hr(i.containedNodes,(function(t,i){e.containedNodes[i]=t;})),i.containedNodes={},Hr(i.containedEdges,(function(t,i){e.containedEdges[i]=t;})),i.containedEdges={},Hr(i.edges,(function(t){Hr(e.edges,(function(i){var o,n,r=On(o=i.clusteringEdgeReplacingIds).call(o,t.id);-1!==r&&(Hr(t.clusteringEdgeReplacingIds,(function(t){i.clusteringEdgeReplacingIds.push(t),e.body.edges[t].edgeReplacedById=i.id;})),ls(n=i.clusteringEdgeReplacingIds).call(n,r,1));}));})),i.edges=[];}}]),i}(vc),Bu=function(){function t(e){var i=this;Kh(this,t),this.body=e,this.clusteredNodes={},this.clusteredEdges={},this.options={},this.defaultOptions={},bt(this.options,this.defaultOptions),this.body.emitter.on("_resetData",(function(){i.clusteredNodes={},i.clusteredEdges={};}));}return Zh(t,[{key:"clusterByHubsize",value:function(t,e){void 0===t?t=this._getHubSize():"object"===cr(t)&&(e=this._checkOptions(t),t=this._getHubSize());for(var i=[],o=0;o<this.body.nodeIndices.length;o++){var n=this.body.nodes[this.body.nodeIndices[o]];n.edges.length>=t&&i.push(n.id);}for(var r=0;r<i.length;r++)this.clusterByConnection(i[r],e,!0);this.body.emitter.emit("_dataChanged");}},{key:"cluster",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(void 0===e.joinCondition)throw new Error("Cannot call clusterByNodeData without a joinCondition function in the options.");e=this._checkOptions(e);var o={},n={};Hr(this.body.nodes,(function(i,r){i.options&&!0===e.joinCondition(i.options)&&(o[r]=i,Hr(i.edges,(function(e){void 0===t.clusteredEdges[e.id]&&(n[e.id]=e);})));})),this._cluster(o,n,e,i);}},{key:"clusterByEdgeCount",value:function(t,e){var i=this,o=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];e=this._checkOptions(e);for(var n,r,s,a=[],h={},d=function(o){var d={},l={},c=i.body.nodeIndices[o],u=i.body.nodes[c];if(void 0===h[c]){s=0,r=[];for(var f=0;f<u.edges.length;f++)n=u.edges[f],void 0===i.clusteredEdges[n.id]&&(n.toId!==n.fromId&&s++,r.push(n));if(s===t){for(var p=function(t){if(void 0===e.joinCondition||null===e.joinCondition)return !0;var i=Pu.cloneOptions(t);return e.joinCondition(i)},v=!0,g=0;g<r.length;g++){n=r[g];var y=i._getConnectedId(n,c);if(!p(u)){v=!1;break}l[n.id]=n,d[c]=u,d[y]=i.body.nodes[y],h[c]=!0;}if(ir(d).length>0&&ir(l).length>0&&!0===v){var m=function(){for(var t=0;t<a.length;++t)for(var e in d)if(void 0!==a[t].nodes[e])return a[t]}();if(void 0!==m){for(var b in d)void 0===m.nodes[b]&&(m.nodes[b]=d[b]);for(var w in l)void 0===m.edges[w]&&(m.edges[w]=l[w]);}else a.push({nodes:d,edges:l});}}}},l=0;l<this.body.nodeIndices.length;l++)d(l);for(var c=0;c<a.length;c++)this._cluster(a[c].nodes,a[c].edges,e,!1);!0===o&&this.body.emitter.emit("_dataChanged");}},{key:"clusterOutliers",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];this.clusterByEdgeCount(1,t,e);}},{key:"clusterBridges",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];this.clusterByEdgeCount(2,t,e);}},{key:"clusterByConnection",value:function(t,e){var i,o=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(void 0===t)throw new Error("No nodeId supplied to clusterByConnection!");if(void 0===this.body.nodes[t])throw new Error("The nodeId given to clusterByConnection does not exist!");var n=this.body.nodes[t];void 0===(e=this._checkOptions(e,n)).clusterNodeProperties.x&&(e.clusterNodeProperties.x=n.x),void 0===e.clusterNodeProperties.y&&(e.clusterNodeProperties.y=n.y),void 0===e.clusterNodeProperties.fixed&&(e.clusterNodeProperties.fixed={},e.clusterNodeProperties.fixed.x=n.options.fixed.x,e.clusterNodeProperties.fixed.y=n.options.fixed.y);var r={},s={},a=n.id,h=Pu.cloneOptions(n);r[a]=n;for(var d=0;d<n.edges.length;d++){var l=n.edges[d];if(void 0===this.clusteredEdges[l.id]){var c=this._getConnectedId(l,a);if(void 0===this.clusteredNodes[c])if(c!==a)if(void 0===e.joinCondition)s[l.id]=l,r[c]=this.body.nodes[c];else {var u=Pu.cloneOptions(this.body.nodes[c]);!0===e.joinCondition(h,u)&&(s[l.id]=l,r[c]=this.body.nodes[c]);}else s[l.id]=l;}}var f=hr(i=ir(r)).call(i,(function(t){return r[t].id}));for(var p in r)if(Object.prototype.hasOwnProperty.call(r,p))for(var v=r[p],g=0;g<v.edges.length;g++){var y=v.edges[g];On(f).call(f,this._getConnectedId(y,v.id))>-1&&(s[y.id]=y);}this._cluster(r,s,e,o);}},{key:"_createClusterEdges",value:function(t,e,i,o){for(var n,r,s,a,h,d,l=ir(t),c=[],u=0;u<l.length;u++){s=t[r=l[u]];for(var f=0;f<s.edges.length;f++)n=s.edges[f],void 0===this.clusteredEdges[n.id]&&(n.toId==n.fromId?e[n.id]=n:n.toId==r?(a=i.id,d=h=n.fromId):(a=n.toId,h=i.id,d=a),void 0===t[d]&&c.push({edge:n,fromId:h,toId:a}));}for(var p=[],v=function(t){for(var e=0;e<p.length;e++){var i=p[e],o=t.fromId===i.fromId&&t.toId===i.toId,n=t.fromId===i.toId&&t.toId===i.fromId;if(o||n)return i}return null},g=0;g<c.length;g++){var y=c[g],m=y.edge,b=v(y);null===b?(b=this._createClusteredEdge(y.fromId,y.toId,m,o),p.push(b)):b.clusteringEdgeReplacingIds.push(m.id),this.body.edges[m.id].edgeReplacedById=b.id,this._backupEdgeOptions(m),m.setOptions({physics:!1});}}},{key:"_checkOptions",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return void 0===t.clusterEdgeProperties&&(t.clusterEdgeProperties={}),void 0===t.clusterNodeProperties&&(t.clusterNodeProperties={}),t}},{key:"_cluster",value:function(t,e,i){var o=!(arguments.length>3&&void 0!==arguments[3])||arguments[3],n=[];for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&void 0!==this.clusteredNodes[r]&&n.push(r);for(var s=0;s<n.length;++s)delete t[n[s]];if(0!=ir(t).length&&(1!=ir(t).length||1==i.clusterNodeProperties.allowSingleNodeCluster)){var a=Ar({},i.clusterNodeProperties);if(void 0!==i.processProperties){var h=[];for(var d in t)if(Object.prototype.hasOwnProperty.call(t,d)){var l=Pu.cloneOptions(t[d]);h.push(l);}var c=[];for(var u in e)if(Object.prototype.hasOwnProperty.call(e,u)&&"clusterEdge:"!==u.substr(0,12)){var f=Pu.cloneOptions(e[u],"edge");c.push(f);}if(!(a=i.processProperties(a,h,c)))throw new Error("The processProperties function does not return properties!")}void 0===a.id&&(a.id="cluster:"+Du());var p=a.id;void 0===a.label&&(a.label="cluster");var v=void 0;void 0===a.x&&(v=this._getClusterPosition(t),a.x=v.x),void 0===a.y&&(void 0===v&&(v=this._getClusterPosition(t)),a.y=v.y),a.id=p;var g=this.body.functions.createNode(a,zu);g.containedNodes=t,g.containedEdges=e,g.clusterEdgeProperties=i.clusterEdgeProperties,this.body.nodes[a.id]=g,this._clusterEdges(t,e,a,i.clusterEdgeProperties),a.id=void 0,!0===o&&this.body.emitter.emit("_dataChanged");}}},{key:"_backupEdgeOptions",value:function(t){void 0===this.clusteredEdges[t.id]&&(this.clusteredEdges[t.id]={physics:t.options.physics});}},{key:"_restoreEdge",value:function(t){var e=this.clusteredEdges[t.id];void 0!==e&&(t.setOptions({physics:e.physics}),delete this.clusteredEdges[t.id]);}},{key:"isCluster",value:function(t){return void 0!==this.body.nodes[t]?!0===this.body.nodes[t].isCluster:(console.error("Node does not exist."),!1)}},{key:"_getClusterPosition",value:function(t){for(var e,i=ir(t),o=t[i[0]].x,n=t[i[0]].x,r=t[i[0]].y,s=t[i[0]].y,a=1;a<i.length;a++)o=(e=t[i[a]]).x<o?e.x:o,n=e.x>n?e.x:n,r=e.y<r?e.y:r,s=e.y>s?e.y:s;return {x:.5*(o+n),y:.5*(r+s)}}},{key:"openCluster",value:function(t,e){var i=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if(void 0===t)throw new Error("No clusterNodeId supplied to openCluster.");var o=this.body.nodes[t];if(void 0===o)throw new Error("The clusterNodeId supplied to openCluster does not exist.");if(!0!==o.isCluster||void 0===o.containedNodes||void 0===o.containedEdges)throw new Error("The node:"+t+" is not a valid cluster.");var n=this.findNode(t),r=On(n).call(n,t)-1;if(r>=0){var s=n[r],a=this.body.nodes[s];return a._openChildCluster(t),delete this.body.nodes[t],void(!0===i&&this.body.emitter.emit("_dataChanged"))}var h=o.containedNodes,d=o.containedEdges;if(void 0!==e&&void 0!==e.releaseFunction&&"function"==typeof e.releaseFunction){var l={},c={x:o.x,y:o.y};for(var u in h)if(Object.prototype.hasOwnProperty.call(h,u)){var f=this.body.nodes[u];l[u]={x:f.x,y:f.y};}var p=e.releaseFunction(c,l);for(var v in h)if(Object.prototype.hasOwnProperty.call(h,v)){var g=this.body.nodes[v];void 0!==p[v]&&(g.x=void 0===p[v].x?o.x:p[v].x,g.y=void 0===p[v].y?o.y:p[v].y);}}else Hr(h,(function(t){!1===t.options.fixed.x&&(t.x=o.x),!1===t.options.fixed.y&&(t.y=o.y);}));for(var y in h)if(Object.prototype.hasOwnProperty.call(h,y)){var m=this.body.nodes[y];m.vx=o.vx,m.vy=o.vy,m.setOptions({physics:!0}),delete this.clusteredNodes[y];}for(var b=[],w=0;w<o.edges.length;w++)b.push(o.edges[w]);for(var k=0;k<b.length;k++){for(var _=b[k],x=this._getConnectedId(_,t),E=this.clusteredNodes[x],O=0;O<_.clusteringEdgeReplacingIds.length;O++){var C=_.clusteringEdgeReplacingIds[O],S=this.body.edges[C];if(void 0!==S)if(void 0!==E){var T=this.body.nodes[E.clusterId];T.containedEdges[S.id]=S,delete d[S.id];var M=S.fromId,D=S.toId;S.toId==x?D=E.clusterId:M=E.clusterId,this._createClusteredEdge(M,D,S,T.clusterEdgeProperties,{hidden:!1,physics:!0});}else this._restoreEdge(S);}_.remove();}for(var P in d)Object.prototype.hasOwnProperty.call(d,P)&&this._restoreEdge(d[P]);delete this.body.nodes[t],!0===i&&this.body.emitter.emit("_dataChanged");}},{key:"getNodesInCluster",value:function(t){var e=[];if(!0===this.isCluster(t)){var i=this.body.nodes[t].containedNodes;for(var o in i)Object.prototype.hasOwnProperty.call(i,o)&&e.push(this.body.nodes[o].id);}return e}},{key:"findNode",value:function(t){for(var e,i=[],o=0;void 0!==this.clusteredNodes[t]&&o<100;){if(void 0===(e=this.body.nodes[t]))return [];i.push(e.id),t=this.clusteredNodes[t].clusterId,o++;}return void 0===(e=this.body.nodes[t])?[]:(i.push(e.id),_u(i).call(i),i)}},{key:"updateClusteredNode",value:function(t,e){if(void 0===t)throw new Error("No clusteredNodeId supplied to updateClusteredNode.");if(void 0===e)throw new Error("No newOptions supplied to updateClusteredNode.");if(void 0===this.body.nodes[t])throw new Error("The clusteredNodeId supplied to updateClusteredNode does not exist.");this.body.nodes[t].setOptions(e),this.body.emitter.emit("_dataChanged");}},{key:"updateEdge",value:function(t,e){if(void 0===t)throw new Error("No startEdgeId supplied to updateEdge.");if(void 0===e)throw new Error("No newOptions supplied to updateEdge.");if(void 0===this.body.edges[t])throw new Error("The startEdgeId supplied to updateEdge does not exist.");for(var i=this.getClusteredEdges(t),o=0;o<i.length;o++){this.body.edges[i[o]].setOptions(e);}this.body.emitter.emit("_dataChanged");}},{key:"getClusteredEdges",value:function(t){for(var e=[],i=0;void 0!==t&&void 0!==this.body.edges[t]&&i<100;)e.push(this.body.edges[t].id),t=this.body.edges[t].edgeReplacedById,i++;return _u(e).call(e),e}},{key:"getBaseEdge",value:function(t){return this.getBaseEdges(t)[0]}},{key:"getBaseEdges",value:function(t){for(var e=[t],i=[],o=[],n=0;e.length>0&&n<100;){var r=e.pop();if(void 0!==r){var s=this.body.edges[r];if(void 0!==s){n++;var a=s.clusteringEdgeReplacingIds;if(void 0===a)o.push(r);else for(var h=0;h<a.length;++h){var d=a[h];-1===On(e).call(e,a)&&-1===On(i).call(i,a)&&e.push(d);}i.push(r);}}}return o}},{key:"_getConnectedId",value:function(t,e){return t.toId!=e?t.toId:(t.fromId,t.fromId)}},{key:"_getHubSize",value:function(){for(var t=0,e=0,i=0,o=0,n=0;n<this.body.nodeIndices.length;n++){var r=this.body.nodes[this.body.nodeIndices[n]];r.edges.length>o&&(o=r.edges.length),t+=r.edges.length,e+=Math.pow(r.edges.length,2),i+=1;}t/=i;var s=(e/=i)-Math.pow(t,2),a=Math.sqrt(s),h=Math.floor(t+2*a);return h>o&&(h=o),h}},{key:"_createClusteredEdge",value:function(t,e,i,o,n){var r=Pu.cloneOptions(i,"edge");Ar(r,o),r.from=t,r.to=e,r.id="clusterEdge:"+Du(),void 0!==n&&Ar(r,n);var s=this.body.functions.createEdge(r);return s.clusteringEdgeReplacingIds=[i.id],s.connect(),this.body.edges[s.id]=s,s}},{key:"_clusterEdges",value:function(t,e,i,o){if(e instanceof ru){var n=e,r={};r[n.id]=n,e=r;}if(t instanceof vc){var s=t,a={};a[s.id]=s,t=a;}if(null==i)throw new Error("_clusterEdges: parameter clusterNode required");for(var h in void 0===o&&(o=i.clusterEdgeProperties),this._createClusterEdges(t,e,i,o),e)if(Object.prototype.hasOwnProperty.call(e,h)&&void 0!==this.body.edges[h]){var d=this.body.edges[h];this._backupEdgeOptions(d),d.setOptions({physics:!1});}for(var l in t)Object.prototype.hasOwnProperty.call(t,l)&&(this.clusteredNodes[l]={clusterId:i.id,node:this.body.nodes[l]},this.body.nodes[l].setOptions({physics:!1}));}},{key:"_getClusterNodeForNode",value:function(t){if(void 0!==t){var e=this.clusteredNodes[t];if(void 0!==e){var i=e.clusterId;if(void 0!==i)return this.body.nodes[i]}}}},{key:"_filter",value:function(t,e){var i=[];return Hr(t,(function(t){e(t)&&i.push(t);})),i}},{key:"_updateState",value:function(){var t,e=this,i=[],o={},n=function(t){Hr(e.body.nodes,(function(e){!0===e.isCluster&&t(e);}));};for(t in this.clusteredNodes){if(Object.prototype.hasOwnProperty.call(this.clusteredNodes,t))void 0===this.body.nodes[t]&&i.push(t);}n((function(t){for(var e=0;e<i.length;e++)delete t.containedNodes[i[e]];}));for(var r=0;r<i.length;r++)delete this.clusteredNodes[i[r]];Hr(this.clusteredEdges,(function(t){var i=e.body.edges[t];void 0!==i&&i.endPointsValid()||(o[t]=t);})),n((function(t){Hr(t.containedEdges,(function(t,e){t.endPointsValid()||o[e]||(o[e]=e);}));})),Hr(this.body.edges,(function(t,i){var n=!0,r=t.clusteringEdgeReplacingIds;if(void 0!==r){var s=0;Hr(r,(function(t){var i=e.body.edges[t];void 0!==i&&i.endPointsValid()&&(s+=1);})),n=s>0;}t.endPointsValid()&&n||(o[i]=i);})),n((function(t){Hr(o,(function(i){delete t.containedEdges[i],Hr(t.edges,(function(n,r){n.id!==i?n.clusteringEdgeReplacingIds=e._filter(n.clusteringEdgeReplacingIds,(function(t){return !o[t]})):t.edges[r]=null;})),t.edges=e._filter(t.edges,(function(t){return null!==t}));}));})),Hr(o,(function(t){delete e.clusteredEdges[t];})),Hr(o,(function(t){delete e.body.edges[t];})),Hr(ir(this.body.edges),(function(t){var i=e.body.edges[t],o=e._isClusteredNode(i.fromId)||e._isClusteredNode(i.toId);if(o!==e._isClusteredEdge(i.id))if(o){var n=e._getClusterNodeForNode(i.fromId);void 0!==n&&e._clusterEdges(e.body.nodes[i.fromId],i,n);var r=e._getClusterNodeForNode(i.toId);void 0!==r&&e._clusterEdges(e.body.nodes[i.toId],i,r);}else delete e._clusterEdges[t],e._restoreEdge(i);}));for(var s=!1,a=!0,h=function(){var t=[];n((function(e){var i=ir(e.containedNodes).length,o=!0===e.options.allowSingleNodeCluster;(o&&i<1||!o&&i<2)&&t.push(e.id);}));for(var i=0;i<t.length;++i)e.openCluster(t[i],{},!1);a=t.length>0,s=s||a;};a;)h();s&&this._updateState();}},{key:"_isClusteredNode",value:function(t){return void 0!==this.clusteredNodes[t]}},{key:"_isClusteredEdge",value:function(t){return void 0!==this.clusteredEdges[t]}}]),t}();function Fu(t,e){var i;if(void 0===wr||null==ro(t)){if(dr(t)||(i=function(t,e){var i;if(!t)return;if("string"==typeof t)return Nu(t,e);var o=ur(i=Object.prototype.toString.call(t)).call(i,8,-1);"Object"===o&&t.constructor&&(o=t.constructor.name);if("Map"===o||"Set"===o)return mo(t);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return Nu(t,e)}(t))||e&&t&&"number"==typeof t.length){i&&(t=i);var o=0,n=function(){};return {s:n,n:function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}},e:function(t){throw t},f:n}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var r,s=!0,a=!1;return {s:function(){i=no(t);},n:function(){var t=i.next();return s=t.done,t},e:function(t){a=!0,r=t;},f:function(){try{s||null==i.return||i.return();}finally{if(a)throw r}}}}function Nu(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o}var Au=function(){function t(e,i){var o;Kh(this,t),void 0!==window&&(o=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame),window.requestAnimationFrame=void 0===o?function(t){t();}:o,this.body=e,this.canvas=i,this.redrawRequested=!1,this.renderTimer=void 0,this.requiresTimeout=!0,this.renderingActive=!1,this.renderRequests=0,this.allowRedraw=!0,this.dragging=!1,this.zooming=!1,this.options={},this.defaultOptions={hideEdgesOnDrag:!1,hideEdgesOnZoom:!1,hideNodesOnDrag:!1},bt(this.options,this.defaultOptions),this._determineBrowserMethod(),this.bindEventListeners();}return Zh(t,[{key:"bindEventListeners",value:function(){var t,e=this;this.body.emitter.on("dragStart",(function(){e.dragging=!0;})),this.body.emitter.on("dragEnd",(function(){e.dragging=!1;})),this.body.emitter.on("zoom",(function(){e.zooming=!0,window.clearTimeout(e.zoomTimeoutId),e.zoomTimeoutId=window.setTimeout((function(){var t;e.zooming=!1,Q(t=e._requestRedraw).call(t,e)();}),250);})),this.body.emitter.on("_resizeNodes",(function(){e._resizeNodes();})),this.body.emitter.on("_redraw",(function(){!1===e.renderingActive&&e._redraw();})),this.body.emitter.on("_blockRedraw",(function(){e.allowRedraw=!1;})),this.body.emitter.on("_allowRedraw",(function(){e.allowRedraw=!0,e.redrawRequested=!1;})),this.body.emitter.on("_requestRedraw",Q(t=this._requestRedraw).call(t,this)),this.body.emitter.on("_startRendering",(function(){e.renderRequests+=1,e.renderingActive=!0,e._startRendering();})),this.body.emitter.on("_stopRendering",(function(){e.renderRequests-=1,e.renderingActive=e.renderRequests>0,e.renderTimer=void 0;})),this.body.emitter.on("destroy",(function(){e.renderRequests=0,e.allowRedraw=!1,e.renderingActive=!1,!0===e.requiresTimeout?clearTimeout(e.renderTimer):window.cancelAnimationFrame(e.renderTimer),e.body.emitter.off();}));}},{key:"setOptions",value:function(t){if(void 0!==t){Fr(["hideEdgesOnDrag","hideEdgesOnZoom","hideNodesOnDrag"],this.options,t);}}},{key:"_requestNextFrame",value:function(t,e){if("undefined"!=typeof window){var i,o=window;return !0===this.requiresTimeout?i=o.setTimeout(t,e):o.requestAnimationFrame&&(i=o.requestAnimationFrame(t)),i}}},{key:"_startRendering",value:function(){var t;!0===this.renderingActive&&(void 0===this.renderTimer&&(this.renderTimer=this._requestNextFrame(Q(t=this._renderStep).call(t,this),this.simulationInterval)));}},{key:"_renderStep",value:function(){!0===this.renderingActive&&(this.renderTimer=void 0,!0===this.requiresTimeout&&this._startRendering(),this._redraw(),!1===this.requiresTimeout&&this._startRendering());}},{key:"redraw",value:function(){this.body.emitter.emit("setSize"),this._redraw();}},{key:"_requestRedraw",value:function(){var t=this;!0!==this.redrawRequested&&!1===this.renderingActive&&!0===this.allowRedraw&&(this.redrawRequested=!0,this._requestNextFrame((function(){t._redraw(!1);}),0));}},{key:"_redraw",value:function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(!0===this.allowRedraw){this.body.emitter.emit("initRedraw"),this.redrawRequested=!1;var e={drawExternalLabels:null};0!==this.canvas.frame.canvas.width&&0!==this.canvas.frame.canvas.height||this.canvas.setSize(),this.canvas.setTransform();var i=this.canvas.getContext(),o=this.canvas.frame.canvas.clientWidth,n=this.canvas.frame.canvas.clientHeight;if(i.clearRect(0,0,o,n),0===this.canvas.frame.clientWidth)return;if(i.save(),i.translate(this.body.view.translation.x,this.body.view.translation.y),i.scale(this.body.view.scale,this.body.view.scale),i.beginPath(),this.body.emitter.emit("beforeDrawing",i),i.closePath(),!1===t&&(!1===this.dragging||!0===this.dragging&&!1===this.options.hideEdgesOnDrag)&&(!1===this.zooming||!0===this.zooming&&!1===this.options.hideEdgesOnZoom)&&this._drawEdges(i),!1===this.dragging||!0===this.dragging&&!1===this.options.hideNodesOnDrag){var r=this._drawNodes(i,t),s=r.drawExternalLabels;e.drawExternalLabels=s;}!1===t&&(!1===this.dragging||!0===this.dragging&&!1===this.options.hideEdgesOnDrag)&&(!1===this.zooming||!0===this.zooming&&!1===this.options.hideEdgesOnZoom)&&this._drawArrows(i),null!=e.drawExternalLabels&&e.drawExternalLabels(),!1===t&&this._drawSelectionBox(i),i.beginPath(),this.body.emitter.emit("afterDrawing",i),i.closePath(),i.restore(),!0===t&&i.clearRect(0,0,o,n);}}},{key:"_resizeNodes",value:function(){this.canvas.setTransform();var t=this.canvas.getContext();t.save(),t.translate(this.body.view.translation.x,this.body.view.translation.y),t.scale(this.body.view.scale,this.body.view.scale);var e,i=this.body.nodes;for(var o in i)Object.prototype.hasOwnProperty.call(i,o)&&((e=i[o]).resize(t),e.updateBoundingBox(t,e.selected));t.restore();}},{key:"_drawNodes",value:function(t){for(var e,i,o=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=this.body.nodes,r=this.body.nodeIndices,s=[],a=[],h=20,d=this.canvas.DOMtoCanvas({x:-h,y:-h}),l=this.canvas.DOMtoCanvas({x:this.canvas.frame.canvas.clientWidth+h,y:this.canvas.frame.canvas.clientHeight+h}),c={top:d.y,left:d.x,bottom:l.y,right:l.x},u=[],f=0;f<r.length;f++)if((e=n[r[f]]).hover)a.push(r[f]);else if(e.isSelected())s.push(r[f]);else if(!0===o){var p=e.draw(t);null!=p.drawExternalLabel&&u.push(p.drawExternalLabel);}else if(!0===e.isBoundingBoxOverlappingWith(c)){var v=e.draw(t);null!=v.drawExternalLabel&&u.push(v.drawExternalLabel);}else e.updateBoundingBox(t,e.selected);var g=s.length,y=a.length;for(i=0;i<g;i++){var m=(e=n[s[i]]).draw(t);null!=m.drawExternalLabel&&u.push(m.drawExternalLabel);}for(i=0;i<y;i++){var b=(e=n[a[i]]).draw(t);null!=b.drawExternalLabel&&u.push(b.drawExternalLabel);}return {drawExternalLabels:function(){var t,e=Fu(u);try{for(e.s();!(t=e.n()).done;){(0,t.value)();}}catch(t){e.e(t);}finally{e.f();}}}}},{key:"_drawEdges",value:function(t){for(var e=this.body.edges,i=this.body.edgeIndices,o=0;o<i.length;o++){var n=e[i[o]];!0===n.connected&&n.draw(t);}}},{key:"_drawArrows",value:function(t){for(var e=this.body.edges,i=this.body.edgeIndices,o=0;o<i.length;o++){var n=e[i[o]];!0===n.connected&&n.drawArrows(t);}}},{key:"_determineBrowserMethod",value:function(){if("undefined"!=typeof window){var t=navigator.userAgent.toLowerCase();this.requiresTimeout=!1,(-1!=On(t).call(t,"msie 9.0")||-1!=On(t).call(t,"safari")&&On(t).call(t,"chrome")<=-1)&&(this.requiresTimeout=!0);}else this.requiresTimeout=!0;}},{key:"_drawSelectionBox",value:function(t){if(this.body.selectionBox.show){t.beginPath();var e=this.body.selectionBox.position.end.x-this.body.selectionBox.position.start.x,i=this.body.selectionBox.position.end.y-this.body.selectionBox.position.start.y;t.rect(this.body.selectionBox.position.start.x,this.body.selectionBox.position.start.y,e,i),t.fillStyle="rgba(151, 194, 252, 0.2)",t.fillRect(this.body.selectionBox.position.start.x,this.body.selectionBox.position.start.y,e,i),t.strokeStyle="rgba(151, 194, 252, 1)",t.stroke();}else t.closePath();}}]),t}(),Ru=F.setInterval;function ju(t,e){e.inputHandler=function(t){t.isFirst&&e(t);},t.on("hammer.input",e.inputHandler);}function Lu(t,e){return e.inputHandler=function(t){t.isFinal&&e(t);},t.on("hammer.input",e.inputHandler)}var Hu=function(){function t(e){Kh(this,t),this.body=e,this.pixelRatio=1,this.cameraState={},this.initialized=!1,this.canvasViewCenter={},this._cleanupCallbacks=[],this.options={},this.defaultOptions={autoResize:!0,height:"100%",width:"100%"},bt(this.options,this.defaultOptions),this.bindEventListeners();}return Zh(t,[{key:"bindEventListeners",value:function(){var t,e=this;this.body.emitter.once("resize",(function(t){0!==t.width&&(e.body.view.translation.x=.5*t.width),0!==t.height&&(e.body.view.translation.y=.5*t.height);})),this.body.emitter.on("setSize",Q(t=this.setSize).call(t,this)),this.body.emitter.on("destroy",(function(){e.hammerFrame.destroy(),e.hammer.destroy(),e._cleanUp();}));}},{key:"setOptions",value:function(t){var e,i,o,n,r,s=this;if(void 0!==t){Fr(["width","height","autoResize"],this.options,t);}if(this._cleanUp(),!0===this.options.autoResize){var a;if(window.ResizeObserver){var h=new ResizeObserver((function(){!0===s.setSize()&&s.body.emitter.emit("_requestRedraw");})),d=this.frame;h.observe(d),this._cleanupCallbacks.push((function(){h.unobserve(d);}));}else {var l=Ru((function(){!0===s.setSize()&&s.body.emitter.emit("_requestRedraw");}),1e3);this._cleanupCallbacks.push((function(){clearInterval(l);}));}var c=Q(a=this._onResize).call(a,this);e=window,i="resize",o=c,e.addEventListener?(void 0===n&&(n=!1),"mousewheel"===i&&On(r=navigator.userAgent).call(r,"Firefox")>=0&&(i="DOMMouseScroll"),e.addEventListener(i,o,n)):e.attachEvent("on"+i,o),this._cleanupCallbacks.push((function(){!function(t,e,i,o){var n;t.removeEventListener?(void 0===o&&(o=!1),"mousewheel"===e&&On(n=navigator.userAgent).call(n,"Firefox")>=0&&(e="DOMMouseScroll"),t.removeEventListener(e,i,o)):t.detachEvent("on"+e,i);}(window,"resize",c);}));}}},{key:"_cleanUp",value:function(){var t,e,i;qo(t=_u(e=ls(i=this._cleanupCallbacks).call(i,0)).call(e)).call(t,(function(t){try{t();}catch(t){console.error(t);}}));}},{key:"_onResize",value:function(){this.setSize(),this.body.emitter.emit("_redraw");}},{key:"_getCameraState",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.pixelRatio;!0===this.initialized&&(this.cameraState.previousWidth=this.frame.canvas.width/t,this.cameraState.previousHeight=this.frame.canvas.height/t,this.cameraState.scale=this.body.view.scale,this.cameraState.position=this.DOMtoCanvas({x:.5*this.frame.canvas.width/t,y:.5*this.frame.canvas.height/t}));}},{key:"_setCameraState",value:function(){if(void 0!==this.cameraState.scale&&0!==this.frame.canvas.clientWidth&&0!==this.frame.canvas.clientHeight&&0!==this.pixelRatio&&this.cameraState.previousWidth>0&&this.cameraState.previousHeight>0){var t=this.frame.canvas.width/this.pixelRatio/this.cameraState.previousWidth,e=this.frame.canvas.height/this.pixelRatio/this.cameraState.previousHeight,i=this.cameraState.scale;1!=t&&1!=e?i=.5*this.cameraState.scale*(t+e):1!=t?i=this.cameraState.scale*t:1!=e&&(i=this.cameraState.scale*e),this.body.view.scale=i;var o=this.DOMtoCanvas({x:.5*this.frame.canvas.clientWidth,y:.5*this.frame.canvas.clientHeight}),n={x:o.x-this.cameraState.position.x,y:o.y-this.cameraState.position.y};this.body.view.translation.x+=n.x*this.body.view.scale,this.body.view.translation.y+=n.y*this.body.view.scale;}}},{key:"_prepareValue",value:function(t){if("number"==typeof t)return t+"px";if("string"==typeof t){if(-1!==On(t).call(t,"%")||-1!==On(t).call(t,"px"))return t;if(-1===On(t).call(t,"%"))return t+"px"}throw new Error("Could not use the value supplied for width or height:"+t)}},{key:"_create",value:function(){for(;this.body.container.hasChildNodes();)this.body.container.removeChild(this.body.container.firstChild);if(this.frame=document.createElement("div"),this.frame.className="vis-network",this.frame.style.position="relative",this.frame.style.overflow="hidden",this.frame.tabIndex=900,this.frame.canvas=document.createElement("canvas"),this.frame.canvas.style.position="relative",this.frame.appendChild(this.frame.canvas),this.frame.canvas.getContext)this._setPixelRatio(),this.setTransform();else {var t=document.createElement("DIV");t.style.color="red",t.style.fontWeight="bold",t.style.padding="10px",t.innerHTML="Error: your browser does not support HTML canvas",this.frame.canvas.appendChild(t);}this.body.container.appendChild(this.frame),this.body.view.scale=1,this.body.view.translation={x:.5*this.frame.canvas.clientWidth,y:.5*this.frame.canvas.clientHeight},this._bindHammer();}},{key:"_bindHammer",value:function(){var t=this;void 0!==this.hammer&&this.hammer.destroy(),this.drag={},this.pinch={},this.hammer=new Yh(this.frame.canvas),this.hammer.get("pinch").set({enable:!0}),this.hammer.get("pan").set({threshold:5,direction:Yh.DIRECTION_ALL}),ju(this.hammer,(function(e){t.body.eventListeners.onTouch(e);})),this.hammer.on("tap",(function(e){t.body.eventListeners.onTap(e);})),this.hammer.on("doubletap",(function(e){t.body.eventListeners.onDoubleTap(e);})),this.hammer.on("press",(function(e){t.body.eventListeners.onHold(e);})),this.hammer.on("panstart",(function(e){t.body.eventListeners.onDragStart(e);})),this.hammer.on("panmove",(function(e){t.body.eventListeners.onDrag(e);})),this.hammer.on("panend",(function(e){t.body.eventListeners.onDragEnd(e);})),this.hammer.on("pinch",(function(e){t.body.eventListeners.onPinch(e);})),this.frame.canvas.addEventListener("wheel",(function(e){t.body.eventListeners.onMouseWheel(e);})),this.frame.canvas.addEventListener("mousemove",(function(e){t.body.eventListeners.onMouseMove(e);})),this.frame.canvas.addEventListener("contextmenu",(function(e){t.body.eventListeners.onContext(e);})),this.hammerFrame=new Yh(this.frame),Lu(this.hammerFrame,(function(e){t.body.eventListeners.onRelease(e);}));}},{key:"setSize",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.options.width,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.options.height;t=this._prepareValue(t),e=this._prepareValue(e);var i=!1,o=this.frame.canvas.width,n=this.frame.canvas.height,r=this.pixelRatio;if(this._setPixelRatio(),t!=this.options.width||e!=this.options.height||this.frame.style.width!=t||this.frame.style.height!=e)this._getCameraState(r),this.frame.style.width=t,this.frame.style.height=e,this.frame.canvas.style.width="100%",this.frame.canvas.style.height="100%",this.frame.canvas.width=Math.round(this.frame.canvas.clientWidth*this.pixelRatio),this.frame.canvas.height=Math.round(this.frame.canvas.clientHeight*this.pixelRatio),this.options.width=t,this.options.height=e,this.canvasViewCenter={x:.5*this.frame.clientWidth,y:.5*this.frame.clientHeight},i=!0;else {var s=Math.round(this.frame.canvas.clientWidth*this.pixelRatio),a=Math.round(this.frame.canvas.clientHeight*this.pixelRatio);this.frame.canvas.width===s&&this.frame.canvas.height===a||this._getCameraState(r),this.frame.canvas.width!==s&&(this.frame.canvas.width=s,i=!0),this.frame.canvas.height!==a&&(this.frame.canvas.height=a,i=!0);}return !0===i&&(this.body.emitter.emit("resize",{width:Math.round(this.frame.canvas.width/this.pixelRatio),height:Math.round(this.frame.canvas.height/this.pixelRatio),oldWidth:Math.round(o/this.pixelRatio),oldHeight:Math.round(n/this.pixelRatio)}),this._setCameraState()),this.initialized=!0,i}},{key:"getContext",value:function(){return this.frame.canvas.getContext("2d")}},{key:"_determinePixelRatio",value:function(){var t=this.getContext();if(void 0===t)throw new Error("Could not get canvax context");var e=1;return "undefined"!=typeof window&&(e=window.devicePixelRatio||1),e/(t.webkitBackingStorePixelRatio||t.mozBackingStorePixelRatio||t.msBackingStorePixelRatio||t.oBackingStorePixelRatio||t.backingStorePixelRatio||1)}},{key:"_setPixelRatio",value:function(){this.pixelRatio=this._determinePixelRatio();}},{key:"setTransform",value:function(){var t=this.getContext();if(void 0===t)throw new Error("Could not get canvax context");t.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);}},{key:"_XconvertDOMtoCanvas",value:function(t){return (t-this.body.view.translation.x)/this.body.view.scale}},{key:"_XconvertCanvasToDOM",value:function(t){return t*this.body.view.scale+this.body.view.translation.x}},{key:"_YconvertDOMtoCanvas",value:function(t){return (t-this.body.view.translation.y)/this.body.view.scale}},{key:"_YconvertCanvasToDOM",value:function(t){return t*this.body.view.scale+this.body.view.translation.y}},{key:"canvasToDOM",value:function(t){return {x:this._XconvertCanvasToDOM(t.x),y:this._YconvertCanvasToDOM(t.y)}}},{key:"DOMtoCanvas",value:function(t){return {x:this._XconvertDOMtoCanvas(t.x),y:this._YconvertDOMtoCanvas(t.y)}}}]),t}();function Wu(t,e){var i=bt({nodes:e,minZoomLevel:Number.MIN_VALUE,maxZoomLevel:1},null!=t?t:{});if(!dr(i.nodes))throw new TypeError("Nodes has to be an array of ids.");if(0===i.nodes.length&&(i.nodes=e),!("number"==typeof i.minZoomLevel&&i.minZoomLevel>0))throw new TypeError("Min zoom level has to be a number higher than zero.");if(!("number"==typeof i.maxZoomLevel&&i.minZoomLevel<=i.maxZoomLevel))throw new TypeError("Max zoom level has to be a number higher than min zoom level.");return i}var Vu=function(){function t(e,i){var o,n,r=this;Kh(this,t),this.body=e,this.canvas=i,this.animationSpeed=1/this.renderRefreshRate,this.animationEasingFunction="easeInOutQuint",this.easingTime=0,this.sourceScale=0,this.targetScale=0,this.sourceTranslation=0,this.targetTranslation=0,this.lockedOnNodeId=void 0,this.lockedOnNodeOffset=void 0,this.touchTime=0,this.viewFunction=void 0,this.body.emitter.on("fit",Q(o=this.fit).call(o,this)),this.body.emitter.on("animationFinished",(function(){r.body.emitter.emit("_stopRendering");})),this.body.emitter.on("unlockNode",Q(n=this.releaseNode).call(n,this));}return Zh(t,[{key:"setOptions",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.options=t;}},{key:"fit",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1];t=Wu(t,this.body.nodeIndices);var i,o,n=this.canvas.frame.canvas.clientWidth,r=this.canvas.frame.canvas.clientHeight;if(0===n||0===r)o=1,i=Pu.getRange(this.body.nodes,t.nodes);else if(!0===e){var s=0;for(var a in this.body.nodes)if(Object.prototype.hasOwnProperty.call(this.body.nodes,a)){var h=this.body.nodes[a];!0===h.predefinedPosition&&(s+=1);}if(s>.5*this.body.nodeIndices.length)return void this.fit(t,!1);i=Pu.getRange(this.body.nodes,t.nodes);var d=this.body.nodeIndices.length;o=12.662/(d+7.4147)+.0964822;var l=Math.min(n/600,r/600);o*=l;}else {this.body.emitter.emit("_resizeNodes"),i=Pu.getRange(this.body.nodes,t.nodes);var c=1.1*Math.abs(i.maxX-i.minX),u=1.1*Math.abs(i.maxY-i.minY),f=n/c,p=r/u;o=f<=p?f:p;}o>t.maxZoomLevel?o=t.maxZoomLevel:o<t.minZoomLevel&&(o=t.minZoomLevel);var v=Pu.findCenter(i),g={position:v,scale:o,animation:t.animation};this.moveTo(g);}},{key:"focus",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(void 0!==this.body.nodes[t]){var i={x:this.body.nodes[t].x,y:this.body.nodes[t].y};e.position=i,e.lockedOnNode=t,this.moveTo(e);}else console.error("Node: "+t+" cannot be found.");}},{key:"moveTo",value:function(t){if(void 0!==t){if(null!=t.offset){if(null!=t.offset.x){if(t.offset.x=+t.offset.x,!Pd(t.offset.x))throw new TypeError('The option "offset.x" has to be a finite number.')}else t.offset.x=0;if(null!=t.offset.y){if(t.offset.y=+t.offset.y,!Pd(t.offset.y))throw new TypeError('The option "offset.y" has to be a finite number.')}else t.offset.x=0;}else t.offset={x:0,y:0};if(null!=t.position){if(null!=t.position.x){if(t.position.x=+t.position.x,!Pd(t.position.x))throw new TypeError('The option "position.x" has to be a finite number.')}else t.position.x=0;if(null!=t.position.y){if(t.position.y=+t.position.y,!Pd(t.position.y))throw new TypeError('The option "position.y" has to be a finite number.')}else t.position.x=0;}else t.position=this.getViewPosition();if(null!=t.scale){if(t.scale=+t.scale,!(t.scale>0))throw new TypeError('The option "scale" has to be a number greater than zero.')}else t.scale=this.body.view.scale;void 0===t.animation&&(t.animation={duration:0}),!1===t.animation&&(t.animation={duration:0}),!0===t.animation&&(t.animation={}),void 0===t.animation.duration&&(t.animation.duration=1e3),void 0===t.animation.easingFunction&&(t.animation.easingFunction="easeInOutQuad"),this.animateView(t);}else t={};}},{key:"animateView",value:function(t){if(void 0!==t){this.animationEasingFunction=t.animation.easingFunction,this.releaseNode(),!0===t.locked&&(this.lockedOnNodeId=t.lockedOnNode,this.lockedOnNodeOffset=t.offset),0!=this.easingTime&&this._transitionRedraw(!0),this.sourceScale=this.body.view.scale,this.sourceTranslation=this.body.view.translation,this.targetScale=t.scale,this.body.view.scale=this.targetScale;var e,i,o=this.canvas.DOMtoCanvas({x:.5*this.canvas.frame.canvas.clientWidth,y:.5*this.canvas.frame.canvas.clientHeight}),n=o.x-t.position.x,r=o.y-t.position.y;if(this.targetTranslation={x:this.sourceTranslation.x+n*this.targetScale+t.offset.x,y:this.sourceTranslation.y+r*this.targetScale+t.offset.y},0===t.animation.duration)if(null!=this.lockedOnNodeId)this.viewFunction=Q(e=this._lockedRedraw).call(e,this),this.body.emitter.on("initRedraw",this.viewFunction);else this.body.view.scale=this.targetScale,this.body.view.translation=this.targetTranslation,this.body.emitter.emit("_requestRedraw");else this.animationSpeed=1/(60*t.animation.duration*.001)||1/60,this.animationEasingFunction=t.animation.easingFunction,this.viewFunction=Q(i=this._transitionRedraw).call(i,this),this.body.emitter.on("initRedraw",this.viewFunction),this.body.emitter.emit("_startRendering");}}},{key:"_lockedRedraw",value:function(){var t=this.body.nodes[this.lockedOnNodeId].x,e=this.body.nodes[this.lockedOnNodeId].y,i=this.canvas.DOMtoCanvas({x:.5*this.canvas.frame.canvas.clientWidth,y:.5*this.canvas.frame.canvas.clientHeight}),o=i.x-t,n=i.y-e,r=this.body.view.translation,s={x:r.x+o*this.body.view.scale+this.lockedOnNodeOffset.x,y:r.y+n*this.body.view.scale+this.lockedOnNodeOffset.y};this.body.view.translation=s;}},{key:"releaseNode",value:function(){void 0!==this.lockedOnNodeId&&void 0!==this.viewFunction&&(this.body.emitter.off("initRedraw",this.viewFunction),this.lockedOnNodeId=void 0,this.lockedOnNodeOffset=void 0);}},{key:"_transitionRedraw",value:function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];this.easingTime+=this.animationSpeed,this.easingTime=!0===t?1:this.easingTime;var e=ts[this.animationEasingFunction](this.easingTime);if(this.body.view.scale=this.sourceScale+(this.targetScale-this.sourceScale)*e,this.body.view.translation={x:this.sourceTranslation.x+(this.targetTranslation.x-this.sourceTranslation.x)*e,y:this.sourceTranslation.y+(this.targetTranslation.y-this.sourceTranslation.y)*e},this.easingTime>=1){var i;if(this.body.emitter.off("initRedraw",this.viewFunction),this.easingTime=0,null!=this.lockedOnNodeId)this.viewFunction=Q(i=this._lockedRedraw).call(i,this),this.body.emitter.on("initRedraw",this.viewFunction);this.body.emitter.emit("animationFinished");}}},{key:"getScale",value:function(){return this.body.view.scale}},{key:"getViewPosition",value:function(){return this.canvas.DOMtoCanvas({x:.5*this.canvas.frame.canvas.clientWidth,y:.5*this.canvas.frame.canvas.clientHeight})}}]),t}(),qu=function(){function t(e,i){var o=this;Kh(this,t),this.body=e,this.canvas=i,this.iconsCreated=!1,this.navigationHammers=[],this.boundFunctions={},this.touchTime=0,this.activated=!1,this.body.emitter.on("activate",(function(){o.activated=!0,o.configureKeyboardBindings();})),this.body.emitter.on("deactivate",(function(){o.activated=!1,o.configureKeyboardBindings();})),this.body.emitter.on("destroy",(function(){void 0!==o.keycharm&&o.keycharm.destroy();})),this.options={};}return Zh(t,[{key:"setOptions",value:function(t){void 0!==t&&(this.options=t,this.create());}},{key:"create",value:function(){!0===this.options.navigationButtons?!1===this.iconsCreated&&this.loadNavigationElements():!0===this.iconsCreated&&this.cleanNavigation(),this.configureKeyboardBindings();}},{key:"cleanNavigation",value:function(){if(0!=this.navigationHammers.length){for(var t=0;t<this.navigationHammers.length;t++)this.navigationHammers[t].destroy();this.navigationHammers=[];}this.navigationDOM&&this.navigationDOM.wrapper&&this.navigationDOM.wrapper.parentNode&&this.navigationDOM.wrapper.parentNode.removeChild(this.navigationDOM.wrapper),this.iconsCreated=!1;}},{key:"loadNavigationElements",value:function(){var t=this;this.cleanNavigation(),this.navigationDOM={};var e=["up","down","left","right","zoomIn","zoomOut","zoomExtends"],i=["_moveUp","_moveDown","_moveLeft","_moveRight","_zoomIn","_zoomOut","_fit"];this.navigationDOM.wrapper=document.createElement("div"),this.navigationDOM.wrapper.className="vis-navigation",this.canvas.frame.appendChild(this.navigationDOM.wrapper);for(var o=0;o<e.length;o++){this.navigationDOM[e[o]]=document.createElement("div"),this.navigationDOM[e[o]].className="vis-button vis-"+e[o],this.navigationDOM.wrapper.appendChild(this.navigationDOM[e[o]]);var n,r,s=new Yh(this.navigationDOM[e[o]]);if("_fit"===i[o])ju(s,Q(n=this._fit).call(n,this));else ju(s,Q(r=this.bindToRedraw).call(r,this,i[o]));this.navigationHammers.push(s);}var a=new Yh(this.canvas.frame);Lu(a,(function(){t._stopMovement();})),this.navigationHammers.push(a),this.iconsCreated=!0;}},{key:"bindToRedraw",value:function(t){var e;void 0===this.boundFunctions[t]&&(this.boundFunctions[t]=Q(e=this[t]).call(e,this),this.body.emitter.on("initRedraw",this.boundFunctions[t]),this.body.emitter.emit("_startRendering"));}},{key:"unbindFromRedraw",value:function(t){void 0!==this.boundFunctions[t]&&(this.body.emitter.off("initRedraw",this.boundFunctions[t]),this.body.emitter.emit("_stopRendering"),delete this.boundFunctions[t]);}},{key:"_fit",value:function(){(new Date).valueOf()-this.touchTime>700&&(this.body.emitter.emit("fit",{duration:700}),this.touchTime=(new Date).valueOf());}},{key:"_stopMovement",value:function(){for(var t in this.boundFunctions)Object.prototype.hasOwnProperty.call(this.boundFunctions,t)&&(this.body.emitter.off("initRedraw",this.boundFunctions[t]),this.body.emitter.emit("_stopRendering"));this.boundFunctions={};}},{key:"_moveUp",value:function(){this.body.view.translation.y+=this.options.keyboard.speed.y;}},{key:"_moveDown",value:function(){this.body.view.translation.y-=this.options.keyboard.speed.y;}},{key:"_moveLeft",value:function(){this.body.view.translation.x+=this.options.keyboard.speed.x;}},{key:"_moveRight",value:function(){this.body.view.translation.x-=this.options.keyboard.speed.x;}},{key:"_zoomIn",value:function(){var t=this.body.view.scale,e=this.body.view.scale*(1+this.options.keyboard.speed.zoom),i=this.body.view.translation,o=e/t,n=(1-o)*this.canvas.canvasViewCenter.x+i.x*o,r=(1-o)*this.canvas.canvasViewCenter.y+i.y*o;this.body.view.scale=e,this.body.view.translation={x:n,y:r},this.body.emitter.emit("zoom",{direction:"+",scale:this.body.view.scale,pointer:null});}},{key:"_zoomOut",value:function(){var t=this.body.view.scale,e=this.body.view.scale/(1+this.options.keyboard.speed.zoom),i=this.body.view.translation,o=e/t,n=(1-o)*this.canvas.canvasViewCenter.x+i.x*o,r=(1-o)*this.canvas.canvasViewCenter.y+i.y*o;this.body.view.scale=e,this.body.view.translation={x:n,y:r},this.body.emitter.emit("zoom",{direction:"-",scale:this.body.view.scale,pointer:null});}},{key:"configureKeyboardBindings",value:function(){var t,e,i,o,n,r,s,a,h,d,l,c,u,f,p,v,g,y,m,b,w,k,_,x,E=this;(void 0!==this.keycharm&&this.keycharm.destroy(),!0===this.options.keyboard.enabled)&&(!0===this.options.keyboard.bindToWindow?this.keycharm=oa({container:window,preventDefault:!0}):this.keycharm=oa({container:this.canvas.frame,preventDefault:!0}),this.keycharm.reset(),!0===this.activated&&(Q(t=this.keycharm).call(t,"up",(function(){E.bindToRedraw("_moveUp");}),"keydown"),Q(e=this.keycharm).call(e,"down",(function(){E.bindToRedraw("_moveDown");}),"keydown"),Q(i=this.keycharm).call(i,"left",(function(){E.bindToRedraw("_moveLeft");}),"keydown"),Q(o=this.keycharm).call(o,"right",(function(){E.bindToRedraw("_moveRight");}),"keydown"),Q(n=this.keycharm).call(n,"=",(function(){E.bindToRedraw("_zoomIn");}),"keydown"),Q(r=this.keycharm).call(r,"num+",(function(){E.bindToRedraw("_zoomIn");}),"keydown"),Q(s=this.keycharm).call(s,"num-",(function(){E.bindToRedraw("_zoomOut");}),"keydown"),Q(a=this.keycharm).call(a,"-",(function(){E.bindToRedraw("_zoomOut");}),"keydown"),Q(h=this.keycharm).call(h,"[",(function(){E.bindToRedraw("_zoomOut");}),"keydown"),Q(d=this.keycharm).call(d,"]",(function(){E.bindToRedraw("_zoomIn");}),"keydown"),Q(l=this.keycharm).call(l,"pageup",(function(){E.bindToRedraw("_zoomIn");}),"keydown"),Q(c=this.keycharm).call(c,"pagedown",(function(){E.bindToRedraw("_zoomOut");}),"keydown"),Q(u=this.keycharm).call(u,"up",(function(){E.unbindFromRedraw("_moveUp");}),"keyup"),Q(f=this.keycharm).call(f,"down",(function(){E.unbindFromRedraw("_moveDown");}),"keyup"),Q(p=this.keycharm).call(p,"left",(function(){E.unbindFromRedraw("_moveLeft");}),"keyup"),Q(v=this.keycharm).call(v,"right",(function(){E.unbindFromRedraw("_moveRight");}),"keyup"),Q(g=this.keycharm).call(g,"=",(function(){E.unbindFromRedraw("_zoomIn");}),"keyup"),Q(y=this.keycharm).call(y,"num+",(function(){E.unbindFromRedraw("_zoomIn");}),"keyup"),Q(m=this.keycharm).call(m,"num-",(function(){E.unbindFromRedraw("_zoomOut");}),"keyup"),Q(b=this.keycharm).call(b,"-",(function(){E.unbindFromRedraw("_zoomOut");}),"keyup"),Q(w=this.keycharm).call(w,"[",(function(){E.unbindFromRedraw("_zoomOut");}),"keyup"),Q(k=this.keycharm).call(k,"]",(function(){E.unbindFromRedraw("_zoomIn");}),"keyup"),Q(_=this.keycharm).call(_,"pageup",(function(){E.unbindFromRedraw("_zoomIn");}),"keyup"),Q(x=this.keycharm).call(x,"pagedown",(function(){E.unbindFromRedraw("_zoomOut");}),"keyup")));}}]),t}(),Uu=function(){function t(e,i){Kh(this,t),this.container=e,this.overflowMethod=i||"cap",this.x=0,this.y=0,this.padding=5,this.hidden=!1,this.frame=document.createElement("div"),this.frame.className="vis-tooltip",this.container.appendChild(this.frame);}return Zh(t,[{key:"setPosition",value:function(t,e){this.x=Ko(t),this.y=Ko(e);}},{key:"setText",value:function(t){t instanceof Element?(this.frame.innerHTML="",this.frame.appendChild(t)):this.frame.innerHTML=t;}},{key:"show",value:function(t){if(void 0===t&&(t=!0),!0===t){var e=this.frame.clientHeight,i=this.frame.clientWidth,o=this.frame.parentNode.clientHeight,n=this.frame.parentNode.clientWidth,r=0,s=0;if("flip"==this.overflowMethod){var a=!1,h=!0;this.y-e<this.padding&&(h=!1),this.x+i>n-this.padding&&(a=!0),r=a?this.x-i:this.x,s=h?this.y-e:this.y;}else (s=this.y-e)+e+this.padding>o&&(s=o-e-this.padding),s<this.padding&&(s=this.padding),(r=this.x)+i+this.padding>n&&(r=n-i-this.padding),r<this.padding&&(r=this.padding);this.frame.style.left=r+"px",this.frame.style.top=s+"px",this.frame.style.visibility="visible",this.hidden=!1;}else this.hide();}},{key:"hide",value:function(){this.hidden=!0,this.frame.style.left="0",this.frame.style.top="0",this.frame.style.visibility="hidden";}},{key:"destroy",value:function(){this.frame.parentNode.removeChild(this.frame);}}]),t}();function Yu(t,e){var i;if(void 0===wr||null==ro(t)){if(dr(t)||(i=function(t,e){var i;if(!t)return;if("string"==typeof t)return Xu(t,e);var o=ur(i=Object.prototype.toString.call(t)).call(i,8,-1);"Object"===o&&t.constructor&&(o=t.constructor.name);if("Map"===o||"Set"===o)return mo(t);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return Xu(t,e)}(t))||e&&t&&"number"==typeof t.length){i&&(t=i);var o=0,n=function(){};return {s:n,n:function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}},e:function(t){throw t},f:n}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var r,s=!0,a=!1;return {s:function(){i=no(t);},n:function(){var t=i.next();return s=t.done,t},e:function(t){a=!0,r=t;},f:function(){try{s||null==i.return||i.return();}finally{if(a)throw r}}}}function Xu(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o}var Gu=function(){function t(e,i,o){var n,r,s,a,h,d,l,c,u,f,p,v,g;Kh(this,t),this.body=e,this.canvas=i,this.selectionHandler=o,this.navigationHandler=new qu(e,i),this.body.eventListeners.onTap=Q(n=this.onTap).call(n,this),this.body.eventListeners.onTouch=Q(r=this.onTouch).call(r,this),this.body.eventListeners.onDoubleTap=Q(s=this.onDoubleTap).call(s,this),this.body.eventListeners.onHold=Q(a=this.onHold).call(a,this),this.body.eventListeners.onDragStart=Q(h=this.onDragStart).call(h,this),this.body.eventListeners.onDrag=Q(d=this.onDrag).call(d,this),this.body.eventListeners.onDragEnd=Q(l=this.onDragEnd).call(l,this),this.body.eventListeners.onMouseWheel=Q(c=this.onMouseWheel).call(c,this),this.body.eventListeners.onPinch=Q(u=this.onPinch).call(u,this),this.body.eventListeners.onMouseMove=Q(f=this.onMouseMove).call(f,this),this.body.eventListeners.onRelease=Q(p=this.onRelease).call(p,this),this.body.eventListeners.onContext=Q(v=this.onContext).call(v,this),this.touchTime=0,this.drag={},this.pinch={},this.popup=void 0,this.popupObj=void 0,this.popupTimer=void 0,this.body.functions.getPointer=Q(g=this.getPointer).call(g,this),this.options={},this.defaultOptions={dragNodes:!0,dragView:!0,hover:!1,keyboard:{enabled:!1,speed:{x:10,y:10,zoom:.02},bindToWindow:!0},navigationButtons:!1,tooltipDelay:300,zoomView:!0,zoomSpeed:1},bt(this.options,this.defaultOptions),this.bindEventListeners();}return Zh(t,[{key:"bindEventListeners",value:function(){var t=this;this.body.emitter.on("destroy",(function(){clearTimeout(t.popupTimer),delete t.body.functions.getPointer;}));}},{key:"setOptions",value:function(t){if(void 0!==t){Nr(["hideEdgesOnDrag","hideEdgesOnZoom","hideNodesOnDrag","keyboard","multiselect","selectable","selectConnectedEdges"],this.options,t),Jr(this.options,t,"keyboard"),t.tooltip&&(bt(this.options.tooltip,t.tooltip),t.tooltip.color&&(this.options.tooltip.color=Ur(t.tooltip.color)));}this.navigationHandler.setOptions(this.options);}},{key:"getPointer",value:function(t){return {x:t.x-(e=this.canvas.frame.canvas,e.getBoundingClientRect().left),y:t.y-Lr(this.canvas.frame.canvas)};var e;}},{key:"onTouch",value:function(t){(new Date).valueOf()-this.touchTime>50&&(this.drag.pointer=this.getPointer(t.center),this.drag.pinched=!1,this.pinch.scale=this.body.view.scale,this.touchTime=(new Date).valueOf());}},{key:"onTap",value:function(t){var e=this.getPointer(t.center),i=this.selectionHandler.options.multiselect&&(t.changedPointers[0].ctrlKey||t.changedPointers[0].metaKey);this.checkSelectionChanges(e,i),this.selectionHandler.commitAndEmit(e,t),this.selectionHandler.generateClickEvent("click",t,e);}},{key:"onDoubleTap",value:function(t){var e=this.getPointer(t.center);this.selectionHandler.generateClickEvent("doubleClick",t,e);}},{key:"onHold",value:function(t){var e=this.getPointer(t.center),i=this.selectionHandler.options.multiselect;this.checkSelectionChanges(e,i),this.selectionHandler.commitAndEmit(e,t),this.selectionHandler.generateClickEvent("click",t,e),this.selectionHandler.generateClickEvent("hold",t,e);}},{key:"onRelease",value:function(t){if((new Date).valueOf()-this.touchTime>10){var e=this.getPointer(t.center);this.selectionHandler.generateClickEvent("release",t,e),this.touchTime=(new Date).valueOf();}}},{key:"onContext",value:function(t){var e=this.getPointer({x:t.clientX,y:t.clientY});this.selectionHandler.generateClickEvent("oncontext",t,e);}},{key:"checkSelectionChanges",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1];!0===e?this.selectionHandler.selectAdditionalOnPoint(t):this.selectionHandler.selectOnPoint(t);}},{key:"_determineDifference",value:function(t,e){var i=function(t,e){for(var i=[],o=0;o<t.length;o++){var n=t[o];-1===On(e).call(e,n)&&i.push(n);}return i};return {nodes:i(t.nodes,e.nodes),edges:i(t.edges,e.edges)}}},{key:"onDragStart",value:function(t){if(!this.drag.dragging){void 0===this.drag.pointer&&this.onTouch(t);var e=this.selectionHandler.getNodeAt(this.drag.pointer);if(this.drag.dragging=!0,this.drag.selection=[],this.drag.translation=bt({},this.body.view.translation),this.drag.nodeId=void 0,t.srcEvent.shiftKey){this.body.selectionBox.show=!0;var i=this.getPointer(t.center);this.body.selectionBox.position.start={x:this.canvas._XconvertDOMtoCanvas(i.x),y:this.canvas._YconvertDOMtoCanvas(i.y)},this.body.selectionBox.position.end={x:this.canvas._XconvertDOMtoCanvas(i.x),y:this.canvas._YconvertDOMtoCanvas(i.y)};}if(void 0!==e&&!0===this.options.dragNodes){this.drag.nodeId=e.id,!1===e.isSelected()&&(this.selectionHandler.unselectAll(),this.selectionHandler.selectObject(e)),this.selectionHandler.generateClickEvent("dragStart",t,this.drag.pointer);var o,n=Yu(this.selectionHandler.getSelectedNodes());try{for(n.s();!(o=n.n()).done;){var r=o.value,s={id:r.id,node:r,x:r.x,y:r.y,xFixed:r.options.fixed.x,yFixed:r.options.fixed.y};r.options.fixed.x=!0,r.options.fixed.y=!0,this.drag.selection.push(s);}}catch(t){n.e(t);}finally{n.f();}}else this.selectionHandler.generateClickEvent("dragStart",t,this.drag.pointer,void 0,!0);}}},{key:"onDrag",value:function(t){var e=this;if(!0!==this.drag.pinched){this.body.emitter.emit("unlockNode");var i=this.getPointer(t.center),o=this.drag.selection;if(o&&o.length&&!0===this.options.dragNodes){this.selectionHandler.generateClickEvent("dragging",t,i);var n=i.x-this.drag.pointer.x,r=i.y-this.drag.pointer.y;qo(o).call(o,(function(t){var i=t.node;!1===t.xFixed&&(i.x=e.canvas._XconvertDOMtoCanvas(e.canvas._XconvertCanvasToDOM(t.x)+n)),!1===t.yFixed&&(i.y=e.canvas._YconvertDOMtoCanvas(e.canvas._YconvertCanvasToDOM(t.y)+r));})),this.body.emitter.emit("startSimulation");}else {if(t.srcEvent.shiftKey){if(this.selectionHandler.generateClickEvent("dragging",t,i,void 0,!0),void 0===this.drag.pointer)return void this.onDragStart(t);this.body.selectionBox.position.end={x:this.canvas._XconvertDOMtoCanvas(i.x),y:this.canvas._YconvertDOMtoCanvas(i.y)},this.body.emitter.emit("_requestRedraw");}if(!0===this.options.dragView&&!t.srcEvent.shiftKey){if(this.selectionHandler.generateClickEvent("dragging",t,i,void 0,!0),void 0===this.drag.pointer)return void this.onDragStart(t);var s=i.x-this.drag.pointer.x,a=i.y-this.drag.pointer.y;this.body.view.translation={x:this.drag.translation.x+s,y:this.drag.translation.y+a},this.body.emitter.emit("_requestRedraw");}}}}},{key:"onDragEnd",value:function(t){var e=this;if(this.drag.dragging=!1,this.body.selectionBox.show){var i;this.body.selectionBox.show=!1;var o=this.body.selectionBox.position,n={minX:Math.min(o.start.x,o.end.x),minY:Math.min(o.start.y,o.end.y),maxX:Math.max(o.start.x,o.end.x),maxY:Math.max(o.start.y,o.end.y)},r=pn(i=this.body.nodeIndices).call(i,(function(t){var i=e.body.nodes[t];return i.x>=n.minX&&i.x<=n.maxX&&i.y>=n.minY&&i.y<=n.maxY}));qo(r).call(r,(function(t){return e.selectionHandler.selectObject(e.body.nodes[t])}));var s=this.getPointer(t.center);this.selectionHandler.commitAndEmit(s,t),this.selectionHandler.generateClickEvent("dragEnd",t,this.getPointer(t.center),void 0,!0),this.body.emitter.emit("_requestRedraw");}else {var a=this.drag.selection;a&&a.length?(qo(a).call(a,(function(t){t.node.options.fixed.x=t.xFixed,t.node.options.fixed.y=t.yFixed;})),this.selectionHandler.generateClickEvent("dragEnd",t,this.getPointer(t.center)),this.body.emitter.emit("startSimulation")):(this.selectionHandler.generateClickEvent("dragEnd",t,this.getPointer(t.center),void 0,!0),this.body.emitter.emit("_requestRedraw"));}}},{key:"onPinch",value:function(t){var e=this.getPointer(t.center);this.drag.pinched=!0,void 0===this.pinch.scale&&(this.pinch.scale=1);var i=this.pinch.scale*t.scale;this.zoom(i,e);}},{key:"zoom",value:function(t,e){if(!0===this.options.zoomView){var i=this.body.view.scale;t<1e-5&&(t=1e-5),t>10&&(t=10);var o=void 0;void 0!==this.drag&&!0===this.drag.dragging&&(o=this.canvas.DOMtoCanvas(this.drag.pointer));var n=this.body.view.translation,r=t/i,s=(1-r)*e.x+n.x*r,a=(1-r)*e.y+n.y*r;if(this.body.view.scale=t,this.body.view.translation={x:s,y:a},null!=o){var h=this.canvas.canvasToDOM(o);this.drag.pointer.x=h.x,this.drag.pointer.y=h.y;}this.body.emitter.emit("_requestRedraw"),i<t?this.body.emitter.emit("zoom",{direction:"+",scale:this.body.view.scale,pointer:e}):this.body.emitter.emit("zoom",{direction:"-",scale:this.body.view.scale,pointer:e});}}},{key:"onMouseWheel",value:function(t){if(!0===this.options.zoomView){if(0!==t.deltaY){var e=this.body.view.scale;e*=1+(t.deltaY<0?1:-1)*(.1*this.options.zoomSpeed);var i=this.getPointer({x:t.clientX,y:t.clientY});this.zoom(e,i);}t.preventDefault();}}},{key:"onMouseMove",value:function(t){var e=this,i=this.getPointer({x:t.clientX,y:t.clientY}),o=!1;void 0!==this.popup&&(!1===this.popup.hidden&&this._checkHidePopup(i),!1===this.popup.hidden&&(o=!0,this.popup.setPosition(i.x+3,i.y-5),this.popup.show())),!1===this.options.keyboard.bindToWindow&&!0===this.options.keyboard.enabled&&this.canvas.frame.focus(),!1===o&&(void 0!==this.popupTimer&&(clearInterval(this.popupTimer),this.popupTimer=void 0),this.drag.dragging||(this.popupTimer=_d((function(){return e._checkShowPopup(i)}),this.options.tooltipDelay))),!0===this.options.hover&&this.selectionHandler.hoverObject(t,i);}},{key:"_checkShowPopup",value:function(t){var e=this.canvas._XconvertDOMtoCanvas(t.x),i=this.canvas._YconvertDOMtoCanvas(t.y),o={left:e,top:i,right:e,bottom:i},n=void 0===this.popupObj?void 0:this.popupObj.id,r=!1,s="node";if(void 0===this.popupObj){for(var a,h=this.body.nodeIndices,d=this.body.nodes,l=[],c=0;c<h.length;c++)!0===(a=d[h[c]]).isOverlappingWith(o)&&(r=!0,void 0!==a.getTitle()&&l.push(h[c]));l.length>0&&(this.popupObj=d[l[l.length-1]],r=!0);}if(void 0===this.popupObj&&!1===r){for(var u,f=this.body.edgeIndices,p=this.body.edges,v=[],g=0;g<f.length;g++)!0===(u=p[f[g]]).isOverlappingWith(o)&&!0===u.connected&&void 0!==u.getTitle()&&v.push(f[g]);v.length>0&&(this.popupObj=p[v[v.length-1]],s="edge");}void 0!==this.popupObj?this.popupObj.id!==n&&(void 0===this.popup&&(this.popup=new Uu(this.canvas.frame)),this.popup.popupTargetType=s,this.popup.popupTargetId=this.popupObj.id,this.popup.setPosition(t.x+3,t.y-5),this.popup.setText(this.popupObj.getTitle()),this.popup.show(),this.body.emitter.emit("showPopup",this.popupObj.id)):void 0!==this.popup&&(this.popup.hide(),this.body.emitter.emit("hidePopup"));}},{key:"_checkHidePopup",value:function(t){var e=this.selectionHandler._pointerToPositionObject(t),i=!1;if("node"===this.popup.popupTargetType){if(void 0!==this.body.nodes[this.popup.popupTargetId]&&!0===(i=this.body.nodes[this.popup.popupTargetId].isOverlappingWith(e))){var o=this.selectionHandler.getNodeAt(t);i=void 0!==o&&o.id===this.popup.popupTargetId;}}else void 0===this.selectionHandler.getNodeAt(t)&&void 0!==this.body.edges[this.popup.popupTargetId]&&(i=this.body.edges[this.popup.popupTargetId].isOverlappingWith(e));!1===i&&(this.popupObj=void 0,this.popup.hide(),this.body.emitter.emit("hidePopup"));}}]),t}(),Ku=ed.getWeakData,$u=Le.set,Zu=Le.getterFor,Qu=Ue.find,Ju=Ue.findIndex,tf=0,ef=function(t){return t.frozen||(t.frozen=new of)},of=function(){this.entries=[];},nf=function(t,e){return Qu(t.entries,(function(t){return t[0]===e}))};of.prototype={get:function(t){var e=nf(this,t);if(e)return e[1]},has:function(t){return !!nf(this,t)},set:function(t,e){var i=nf(this,t);i?i[1]=e:this.entries.push([t,e]);},delete:function(t){var e=Ju(this.entries,(function(e){return e[0]===t}));return ~e&&this.entries.splice(e,1),!!~e}};var rf,sf,af,hf,df,lf={getConstructor:function(t,e,i,o){var n=t((function(t,r){nd(t,n,e),$u(t,{type:e,id:tf++,frozen:void 0}),null!=r&&od(r,t[o],{that:t,AS_ENTRIES:i});})),r=Zu(e),s=function(t,e,i){var o=r(t),n=Ku(R(e),!0);return !0===n?ef(o).set(e,i):n[o.id]=i,t};return ld(n.prototype,{delete:function(t){var e=r(this);if(!m(t))return !1;var i=Ku(t);return !0===i?ef(e).delete(t):i&&k(i,e.id)&&delete i[e.id]},has:function(t){var e=r(this);if(!m(t))return !1;var i=Ku(t);return !0===i?ef(e).has(t):i&&k(i,e.id)}}),ld(n.prototype,i?{get:function(t){var e=r(this);if(m(t)){var i=Ku(t);return !0===i?ef(e).get(t):i?i[e.id]:void 0}},set:function(t,e){return s(this,t,e)}}:{add:function(t){return s(this,t,!0)}}),n}},cf=(o((function(t){var e,i=Le.enforce,o=!r.ActiveXObject&&"ActiveXObject"in r,n=Object.isExtensible,s=function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}},a=t.exports=dd("WeakMap",s,lf);if(ze&&o){e=lf.getConstructor(s,"WeakMap",!0),ed.REQUIRED=!0;var h=a.prototype,d=h.delete,l=h.has,c=h.get,u=h.set;ld(h,{delete:function(t){if(m(t)&&!n(t)){var o=i(this);return o.frozen||(o.frozen=new e),d.call(this,t)||o.frozen.delete(t)}return d.call(this,t)},has:function(t){if(m(t)&&!n(t)){var o=i(this);return o.frozen||(o.frozen=new e),l.call(this,t)||o.frozen.has(t)}return l.call(this,t)},get:function(t){if(m(t)&&!n(t)){var o=i(this);return o.frozen||(o.frozen=new e),l.call(this,t)?c.call(this,t):o.frozen.get(t)}return c.call(this,t)},set:function(t,o){if(m(t)&&!n(t)){var r=i(this);r.frozen||(r.frozen=new e),l.call(this,t)?u.call(this,t,o):r.frozen.set(t,o);}else u.call(this,t,o);return this}});}})),F.WeakMap),uf=(dd("Set",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),gd),F.Set);
    /*! *****************************************************************************
    	Copyright (c) Microsoft Corporation.

    	Permission to use, copy, modify, and/or distribute this software for any
    	purpose with or without fee is hereby granted.

    	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    	PERFORMANCE OF THIS SOFTWARE.
    	***************************************************************************** */
    function ff(t,e){if(!e.has(t))throw new TypeError("attempted to get private field on non-instance");return e.get(t)}function pf(t,e,i){if(!e.has(t))throw new TypeError("attempted to set private field on non-instance");return e.set(t,i),i}function vf(t,e){var i;if(void 0===wr||null==ro(t)){if(dr(t)||(i=function(t,e){var i;if(!t)return;if("string"==typeof t)return gf(t,e);var o=ur(i=Object.prototype.toString.call(t)).call(i,8,-1);"Object"===o&&t.constructor&&(o=t.constructor.name);if("Map"===o||"Set"===o)return mo(t);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return gf(t,e)}(t))||e&&t&&"number"==typeof t.length){i&&(t=i);var o=0,n=function(){};return {s:n,n:function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}},e:function(t){throw t},f:n}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var r,s=!0,a=!1;return {s:function(){i=no(t);},n:function(){var t=i.next();return s=t.done,t},e:function(t){a=!0,r=t;},f:function(){try{s||null==i.return||i.return();}finally{if(a)throw r}}}}function gf(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o}function yf(t,e){var i,o=new uf,n=vf(e);try{for(n.s();!(i=n.n()).done;){var r=i.value;t.has(r)||o.add(r);}}catch(t){n.e(t);}finally{n.f();}return o}var mf=function(){function t(){Kh(this,t),rf.set(this,new uf),sf.set(this,new uf);}return Zh(t,[{key:"add",value:function(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];for(var o=0,n=e;o<n.length;o++){var r=n[o];ff(this,sf).add(r);}}},{key:"delete",value:function(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];for(var o=0,n=e;o<n.length;o++){var r=n[o];ff(this,sf).delete(r);}}},{key:"clear",value:function(){ff(this,sf).clear();}},{key:"getSelection",value:function(){return gr(ff(this,sf))}},{key:"getChanges",value:function(){return {added:gr(yf(ff(this,rf),ff(this,sf))),deleted:gr(yf(ff(this,sf),ff(this,rf))),previous:gr(new uf(ff(this,rf))),current:gr(new uf(ff(this,sf)))}}},{key:"commit",value:function(){var t=this.getChanges();pf(this,rf,ff(this,sf)),pf(this,sf,new uf(ff(this,rf)));var e,i=vf(t.added);try{for(i.s();!(e=i.n()).done;){e.value.select();}}catch(t){i.e(t);}finally{i.f();}var o,n=vf(t.deleted);try{for(n.s();!(o=n.n()).done;){o.value.unselect();}}catch(t){n.e(t);}finally{n.f();}return t}},{key:"size",get:function(){return ff(this,sf).size}}]),t}();rf=new cf,sf=new cf;var bf=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:function(){};Kh(this,t),af.set(this,new mf),hf.set(this,new mf),df.set(this,void 0),pf(this,df,e);}return Zh(t,[{key:"getNodes",value:function(){return ff(this,af).getSelection()}},{key:"getEdges",value:function(){return ff(this,hf).getSelection()}},{key:"addNodes",value:function(){var t;(t=ff(this,af)).add.apply(t,arguments);}},{key:"addEdges",value:function(){var t;(t=ff(this,hf)).add.apply(t,arguments);}},{key:"deleteNodes",value:function(t){ff(this,af).delete(t);}},{key:"deleteEdges",value:function(t){ff(this,hf).delete(t);}},{key:"clear",value:function(){ff(this,af).clear(),ff(this,hf).clear();}},{key:"commit",value:function(){for(var t,e,i={nodes:ff(this,af).commit(),edges:ff(this,hf).commit()},o=arguments.length,n=new Array(o),r=0;r<o;r++)n[r]=arguments[r];return (t=ff(this,df)).call.apply(t,br(e=[this,i]).call(e,n)),i}},{key:"sizeNodes",get:function(){return ff(this,af).size}},{key:"sizeEdges",get:function(){return ff(this,hf).size}}]),t}();function wf(t,e){var i;if(void 0===wr||null==ro(t)){if(dr(t)||(i=function(t,e){var i;if(!t)return;if("string"==typeof t)return kf(t,e);var o=ur(i=Object.prototype.toString.call(t)).call(i,8,-1);"Object"===o&&t.constructor&&(o=t.constructor.name);if("Map"===o||"Set"===o)return mo(t);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return kf(t,e)}(t))||e&&t&&"number"==typeof t.length){i&&(t=i);var o=0,n=function(){};return {s:n,n:function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}},e:function(t){throw t},f:n}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var r,s=!0,a=!1;return {s:function(){i=no(t);},n:function(){var t=i.next();return s=t.done,t},e:function(t){a=!0,r=t;},f:function(){try{s||null==i.return||i.return();}finally{if(a)throw r}}}}function kf(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o}af=new cf,hf=new cf,df=new cf;var _f=function(){function t(e,i){var o=this;Kh(this,t),this.body=e,this.canvas=i,this._selectionAccumulator=new bf,this.hoverObj={nodes:{},edges:{}},this.options={},this.defaultOptions={multiselect:!1,selectable:!0,selectConnectedEdges:!0,hoverConnectedEdges:!0},bt(this.options,this.defaultOptions),this.body.emitter.on("_dataChanged",(function(){o.updateSelection();}));}return Zh(t,[{key:"setOptions",value:function(t){if(void 0!==t){Fr(["multiselect","hoverConnectedEdges","selectable","selectConnectedEdges"],this.options,t);}}},{key:"selectOnPoint",value:function(t){var e=!1;if(!0===this.options.selectable){var i=this.getNodeAt(t)||this.getEdgeAt(t);this.unselectAll(),void 0!==i&&(e=this.selectObject(i)),this.body.emitter.emit("_requestRedraw");}return e}},{key:"selectAdditionalOnPoint",value:function(t){var e=!1;if(!0===this.options.selectable){var i=this.getNodeAt(t)||this.getEdgeAt(t);void 0!==i&&(e=!0,!0===i.isSelected()?this.deselectObject(i):this.selectObject(i),this.body.emitter.emit("_requestRedraw"));}return e}},{key:"_initBaseEvent",value:function(t,e){var i={};return i.pointer={DOM:{x:e.x,y:e.y},canvas:this.canvas.DOMtoCanvas(e)},i.event=t,i}},{key:"generateClickEvent",value:function(t,e,i,o){var n=arguments.length>4&&void 0!==arguments[4]&&arguments[4],r=this._initBaseEvent(e,i);if(!0===n)r.nodes=[],r.edges=[];else {var s=this.getSelection();r.nodes=s.nodes,r.edges=s.edges;}void 0!==o&&(r.previousSelection=o),"click"==t&&(r.items=this.getClickedItems(i)),void 0!==e.controlEdge&&(r.controlEdge=e.controlEdge),this.body.emitter.emit(t,r);}},{key:"selectObject",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.options.selectConnectedEdges;if(void 0!==t){if(t instanceof vc){var i;if(!0===e)(i=this._selectionAccumulator).addEdges.apply(i,gr(t.edges));this._selectionAccumulator.addNodes(t);}else this._selectionAccumulator.addEdges(t);return !0}return !1}},{key:"deselectObject",value:function(t){!0===t.isSelected()&&(t.selected=!1,this._removeFromSelection(t));}},{key:"_getAllNodesOverlappingWith",value:function(t){for(var e=[],i=this.body.nodes,o=0;o<this.body.nodeIndices.length;o++){var n=this.body.nodeIndices[o];i[n].isOverlappingWith(t)&&e.push(n);}return e}},{key:"_pointerToPositionObject",value:function(t){var e=this.canvas.DOMtoCanvas(t);return {left:e.x-1,top:e.y+1,right:e.x+1,bottom:e.y-1}}},{key:"getNodeAt",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this._pointerToPositionObject(t),o=this._getAllNodesOverlappingWith(i);return o.length>0?!0===e?this.body.nodes[o[o.length-1]]:o[o.length-1]:void 0}},{key:"_getEdgesOverlappingWith",value:function(t,e){for(var i=this.body.edges,o=0;o<this.body.edgeIndices.length;o++){var n=this.body.edgeIndices[o];i[n].isOverlappingWith(t)&&e.push(n);}}},{key:"_getAllEdgesOverlappingWith",value:function(t){var e=[];return this._getEdgesOverlappingWith(t,e),e}},{key:"getEdgeAt",value:function(t){for(var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=this.canvas.DOMtoCanvas(t),o=10,n=null,r=this.body.edges,s=0;s<this.body.edgeIndices.length;s++){var a=this.body.edgeIndices[s],h=r[a];if(h.connected){var d=h.from.x,l=h.from.y,c=h.to.x,u=h.to.y,f=h.edgeType.getDistanceToEdge(d,l,c,u,i.x,i.y);f<o&&(n=a,o=f);}}return null!==n?!0===e?this.body.edges[n]:n:void 0}},{key:"_addToHover",value:function(t){t instanceof vc?this.hoverObj.nodes[t.id]=t:this.hoverObj.edges[t.id]=t;}},{key:"_removeFromSelection",value:function(t){var e;t instanceof vc?(this._selectionAccumulator.deleteNodes(t),(e=this._selectionAccumulator).deleteEdges.apply(e,gr(t.edges))):this._selectionAccumulator.deleteEdges(t);}},{key:"unselectAll",value:function(){this._selectionAccumulator.clear(),this._selectionAccumulator.commit();}},{key:"getSelectedNodeCount",value:function(){return this._selectionAccumulator.sizeNodes}},{key:"getSelectedEdgeCount",value:function(){return this._selectionAccumulator.sizeEdges}},{key:"_hoverConnectedEdges",value:function(t){for(var e=0;e<t.edges.length;e++){var i=t.edges[e];i.hover=!0,this._addToHover(i);}}},{key:"emitBlurEvent",value:function(t,e,i){var o=this._initBaseEvent(t,e);!0===i.hover&&(i.hover=!1,i instanceof vc?(o.node=i.id,this.body.emitter.emit("blurNode",o)):(o.edge=i.id,this.body.emitter.emit("blurEdge",o)));}},{key:"emitHoverEvent",value:function(t,e,i){var o=this._initBaseEvent(t,e),n=!1;return !1===i.hover&&(i.hover=!0,this._addToHover(i),n=!0,i instanceof vc?(o.node=i.id,this.body.emitter.emit("hoverNode",o)):(o.edge=i.id,this.body.emitter.emit("hoverEdge",o))),n}},{key:"hoverObject",value:function(t,e){var i=this.getNodeAt(e);void 0===i&&(i=this.getEdgeAt(e));var o=!1;for(var n in this.hoverObj.nodes)Object.prototype.hasOwnProperty.call(this.hoverObj.nodes,n)&&(void 0===i||i instanceof vc&&i.id!=n||i instanceof ru)&&(this.emitBlurEvent(t,e,this.hoverObj.nodes[n]),delete this.hoverObj.nodes[n],o=!0);for(var r in this.hoverObj.edges)Object.prototype.hasOwnProperty.call(this.hoverObj.edges,r)&&(!0===o?(this.hoverObj.edges[r].hover=!1,delete this.hoverObj.edges[r]):(void 0===i||i instanceof ru&&i.id!=r||i instanceof vc&&!i.hover)&&(this.emitBlurEvent(t,e,this.hoverObj.edges[r]),delete this.hoverObj.edges[r],o=!0));if(void 0!==i){var s=ir(this.hoverObj.edges).length,a=ir(this.hoverObj.nodes).length;(o||i instanceof ru&&0===s&&0===a||i instanceof vc&&0===s&&0===a)&&(o=this.emitHoverEvent(t,e,i)),i instanceof vc&&!0===this.options.hoverConnectedEdges&&this._hoverConnectedEdges(i);}!0===o&&this.body.emitter.emit("_requestRedraw");}},{key:"commitAndEmit",value:function(t,e){var i=!1,o=this._selectionAccumulator.commit(),n={nodes:o.nodes.previous,edges:o.edges.previous};o.edges.deleted.length>0&&(this.generateClickEvent("deselectEdge",e,t,n),i=!0),o.nodes.deleted.length>0&&(this.generateClickEvent("deselectNode",e,t,n),i=!0),o.nodes.added.length>0&&(this.generateClickEvent("selectNode",e,t),i=!0),o.edges.added.length>0&&(this.generateClickEvent("selectEdge",e,t),i=!0),!0===i&&this.generateClickEvent("select",e,t);}},{key:"getSelection",value:function(){return {nodes:this.getSelectedNodeIds(),edges:this.getSelectedEdgeIds()}}},{key:"getSelectedNodes",value:function(){return this._selectionAccumulator.getNodes()}},{key:"getSelectedEdges",value:function(){return this._selectionAccumulator.getEdges()}},{key:"getSelectedNodeIds",value:function(){var t;return hr(t=this._selectionAccumulator.getNodes()).call(t,(function(t){return t.id}))}},{key:"getSelectedEdgeIds",value:function(){var t;return hr(t=this._selectionAccumulator.getEdges()).call(t,(function(t){return t.id}))}},{key:"setSelection",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if(!t||!t.nodes&&!t.edges)throw new TypeError("Selection must be an object with nodes and/or edges properties");if((e.unselectAll||void 0===e.unselectAll)&&this.unselectAll(),t.nodes){var i,o=wf(t.nodes);try{for(o.s();!(i=o.n()).done;){var n=i.value,r=this.body.nodes[n];if(!r)throw new RangeError('Node with id "'+n+'" not found');this.selectObject(r,e.highlightEdges);}}catch(t){o.e(t);}finally{o.f();}}if(t.edges){var s,a=wf(t.edges);try{for(a.s();!(s=a.n()).done;){var h=s.value,d=this.body.edges[h];if(!d)throw new RangeError('Edge with id "'+h+'" not found');this.selectObject(d);}}catch(t){a.e(t);}finally{a.f();}}this.body.emitter.emit("_requestRedraw"),this._selectionAccumulator.commit();}},{key:"selectNodes",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if(!t||void 0===t.length)throw "Selection must be an array with ids";this.setSelection({nodes:t},{highlightEdges:e});}},{key:"selectEdges",value:function(t){if(!t||void 0===t.length)throw "Selection must be an array with ids";this.setSelection({edges:t});}},{key:"updateSelection",value:function(){for(var t in this._selectionAccumulator.getNodes())Object.prototype.hasOwnProperty.call(this.body.nodes,t.id)||this._selectionAccumulator.deleteNodes(t);for(var e in this._selectionAccumulator.getEdges())Object.prototype.hasOwnProperty.call(this.body.edges,e.id)||this._selectionAccumulator.deleteEdges(e);}},{key:"getClickedItems",value:function(t){for(var e=this.canvas.DOMtoCanvas(t),i=[],o=this.body.nodeIndices,n=this.body.nodes,r=o.length-1;r>=0;r--){var s=n[o[r]].getItemsOnPoint(e);i.push.apply(i,s);}for(var a=this.body.edgeIndices,h=this.body.edges,d=a.length-1;d>=0;d--){var l=h[a[d]].getItemsOnPoint(e);i.push.apply(i,l);}return i}}]),t}(),xf=function(t){return function(e,i,o,n){N(i);var r=vt(e),s=v(r),a=ot(r.length),h=t?a-1:0,d=t?-1:1;if(o<2)for(;;){if(h in s){n=s[h],h+=d;break}if(h+=d,t?h<0:a<=h)throw TypeError("Reduce of empty array with no initial value")}for(;t?h>=0:a>h;h+=d)h in s&&(n=i(n,s[h],h,r));return n}},Ef={left:xf(!1),right:xf(!0)},Of="process"==f(r.process),Cf=Ef.left,Sf=Io("reduce"),Tf=No("reduce",{1:0});q({target:"Array",proto:!0,forced:!Sf||!Tf||!Of&&sn>79&&sn<83},{reduce:function(t){return Cf(this,t,arguments.length,arguments.length>1?arguments[1]:void 0)}});var Mf=K("Array").reduce,Df=Array.prototype,Pf=function(t){var e=t.reduce;return t===Df||t instanceof Array&&e===Df.reduce?Mf:e},If=[],zf=If.sort,Bf=s((function(){If.sort(void 0);})),Ff=s((function(){If.sort(null);})),Nf=Io("sort");q({target:"Array",proto:!0,forced:Bf||!Ff||!Nf},{sort:function(t){return void 0===t?zf.call(vt(this)):zf.call(vt(this),N(t))}});var Af=K("Array").sort,Rf=Array.prototype,jf=function(t){var e=t.sort;return t===Rf||t instanceof Array&&e===Rf.sort?Af:e},Lf=o((function(t,e){!function(t){function e(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}t.__esModule=!0,t.sort=v;var i=32,o=7,n=256,r=[1,10,100,1e3,1e4,1e5,1e6,1e7,1e8,1e9];function s(t){return t<1e5?t<100?t<10?0:1:t<1e4?t<1e3?2:3:4:t<1e7?t<1e6?5:6:t<1e9?t<1e8?7:8:9}function a(t,e){if(t===e)return 0;if(~~t===t&&~~e===e){if(0===t||0===e)return t<e?-1:1;if(t<0||e<0){if(e>=0)return -1;if(t>=0)return 1;t=-t,e=-e;}var i=s(t),o=s(e),n=0;return i<o?(t*=r[o-i-1],e/=10,n=-1):i>o&&(e*=r[i-o-1],t/=10,n=1),t===e?n:t<e?-1:1}var a=String(t),h=String(e);return a===h?0:a<h?-1:1}function h(t){for(var e=0;t>=i;)e|=1&t,t>>=1;return t+e}function d(t,e,i,o){var n=e+1;if(n===i)return 1;if(o(t[n++],t[e])<0){for(;n<i&&o(t[n],t[n-1])<0;)n++;l(t,e,n);}else for(;n<i&&o(t[n],t[n-1])>=0;)n++;return n-e}function l(t,e,i){for(i--;e<i;){var o=t[e];t[e++]=t[i],t[i--]=o;}}function c(t,e,i,o,n){for(o===e&&o++;o<i;o++){for(var r=t[o],s=e,a=o;s<a;){var h=s+a>>>1;n(r,t[h])<0?a=h:s=h+1;}var d=o-s;switch(d){case 3:t[s+3]=t[s+2];case 2:t[s+2]=t[s+1];case 1:t[s+1]=t[s];break;default:for(;d>0;)t[s+d]=t[s+d-1],d--;}t[s]=r;}}function u(t,e,i,o,n,r){var s=0,a=0,h=1;if(r(t,e[i+n])>0){for(a=o-n;h<a&&r(t,e[i+n+h])>0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a),s+=n,h+=n;}else {for(a=n+1;h<a&&r(t,e[i+n-h])<=0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a);var d=s;s=n-h,h=n-d;}for(s++;s<h;){var l=s+(h-s>>>1);r(t,e[i+l])>0?s=l+1:h=l;}return h}function f(t,e,i,o,n,r){var s=0,a=0,h=1;if(r(t,e[i+n])<0){for(a=n+1;h<a&&r(t,e[i+n-h])<0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a);var d=s;s=n-h,h=n-d;}else {for(a=o-n;h<a&&r(t,e[i+n+h])>=0;)s=h,(h=1+(h<<1))<=0&&(h=a);h>a&&(h=a),s+=n,h+=n;}for(s++;s<h;){var l=s+(h-s>>>1);r(t,e[i+l])<0?h=l:s=l+1;}return h}var p=function(){function t(i,r){e(this,t),this.array=null,this.compare=null,this.minGallop=o,this.length=0,this.tmpStorageLength=n,this.stackLength=0,this.runStart=null,this.runLength=null,this.stackSize=0,this.array=i,this.compare=r,this.length=i.length,this.length<2*n&&(this.tmpStorageLength=this.length>>>1),this.tmp=new Array(this.tmpStorageLength),this.stackLength=this.length<120?5:this.length<1542?10:this.length<119151?19:40,this.runStart=new Array(this.stackLength),this.runLength=new Array(this.stackLength);}return t.prototype.pushRun=function(t,e){this.runStart[this.stackSize]=t,this.runLength[this.stackSize]=e,this.stackSize+=1;},t.prototype.mergeRuns=function(){for(;this.stackSize>1;){var t=this.stackSize-2;if(t>=1&&this.runLength[t-1]<=this.runLength[t]+this.runLength[t+1]||t>=2&&this.runLength[t-2]<=this.runLength[t]+this.runLength[t-1])this.runLength[t-1]<this.runLength[t+1]&&t--;else if(this.runLength[t]>this.runLength[t+1])break;this.mergeAt(t);}},t.prototype.forceMergeRuns=function(){for(;this.stackSize>1;){var t=this.stackSize-2;t>0&&this.runLength[t-1]<this.runLength[t+1]&&t--,this.mergeAt(t);}},t.prototype.mergeAt=function(t){var e=this.compare,i=this.array,o=this.runStart[t],n=this.runLength[t],r=this.runStart[t+1],s=this.runLength[t+1];this.runLength[t]=n+s,t===this.stackSize-3&&(this.runStart[t+1]=this.runStart[t+2],this.runLength[t+1]=this.runLength[t+2]),this.stackSize--;var a=f(i[r],i,o,n,0,e);o+=a,0!=(n-=a)&&0!==(s=u(i[o+n-1],i,r,s,s-1,e))&&(n<=s?this.mergeLow(o,n,r,s):this.mergeHigh(o,n,r,s));},t.prototype.mergeLow=function(t,e,i,n){var r=this.compare,s=this.array,a=this.tmp,h=0;for(h=0;h<e;h++)a[h]=s[t+h];var d=0,l=i,c=t;if(s[c++]=s[l++],0!=--n)if(1!==e){for(var p=this.minGallop;;){var v=0,g=0,y=!1;do{if(r(s[l],a[d])<0){if(s[c++]=s[l++],g++,v=0,0==--n){y=!0;break}}else if(s[c++]=a[d++],v++,g=0,1==--e){y=!0;break}}while((v|g)<p);if(y)break;do{if(0!==(v=f(s[l],a,d,e,0,r))){for(h=0;h<v;h++)s[c+h]=a[d+h];if(c+=v,d+=v,(e-=v)<=1){y=!0;break}}if(s[c++]=s[l++],0==--n){y=!0;break}if(0!==(g=u(a[d],s,l,n,0,r))){for(h=0;h<g;h++)s[c+h]=s[l+h];if(c+=g,l+=g,0==(n-=g)){y=!0;break}}if(s[c++]=a[d++],1==--e){y=!0;break}p--;}while(v>=o||g>=o);if(y)break;p<0&&(p=0),p+=2;}if(this.minGallop=p,p<1&&(this.minGallop=1),1===e){for(h=0;h<n;h++)s[c+h]=s[l+h];s[c+n]=a[d];}else {if(0===e)throw new Error("mergeLow preconditions were not respected");for(h=0;h<e;h++)s[c+h]=a[d+h];}}else {for(h=0;h<n;h++)s[c+h]=s[l+h];s[c+n]=a[d];}else for(h=0;h<e;h++)s[c+h]=a[d+h];},t.prototype.mergeHigh=function(t,e,i,n){var r=this.compare,s=this.array,a=this.tmp,h=0;for(h=0;h<n;h++)a[h]=s[i+h];var d=t+e-1,l=n-1,c=i+n-1,p=0,v=0;if(s[c--]=s[d--],0!=--e)if(1!==n){for(var g=this.minGallop;;){var y=0,m=0,b=!1;do{if(r(a[l],s[d])<0){if(s[c--]=s[d--],y++,m=0,0==--e){b=!0;break}}else if(s[c--]=a[l--],m++,y=0,1==--n){b=!0;break}}while((y|m)<g);if(b)break;do{if(0!=(y=e-f(a[l],s,t,e,e-1,r))){for(e-=y,v=1+(c-=y),p=1+(d-=y),h=y-1;h>=0;h--)s[v+h]=s[p+h];if(0===e){b=!0;break}}if(s[c--]=a[l--],1==--n){b=!0;break}if(0!=(m=n-u(s[d],a,0,n,n-1,r))){for(n-=m,v=1+(c-=m),p=1+(l-=m),h=0;h<m;h++)s[v+h]=a[p+h];if(n<=1){b=!0;break}}if(s[c--]=s[d--],0==--e){b=!0;break}g--;}while(y>=o||m>=o);if(b)break;g<0&&(g=0),g+=2;}if(this.minGallop=g,g<1&&(this.minGallop=1),1===n){for(v=1+(c-=e),p=1+(d-=e),h=e-1;h>=0;h--)s[v+h]=s[p+h];s[c]=a[l];}else {if(0===n)throw new Error("mergeHigh preconditions were not respected");for(p=c-(n-1),h=0;h<n;h++)s[p+h]=a[h];}}else {for(v=1+(c-=e),p=1+(d-=e),h=e-1;h>=0;h--)s[v+h]=s[p+h];s[c]=a[l];}else for(p=c-(n-1),h=0;h<n;h++)s[p+h]=a[h];},t}();function v(t,e,o,n){if(!Array.isArray(t))throw new TypeError("Can only sort arrays");e?"function"!=typeof e&&(n=o,o=e,e=a):e=a,o||(o=0),n||(n=t.length);var r=n-o;if(!(r<2)){var s=0;if(r<i)c(t,o,n,o+(s=d(t,o,n,e)),e);else {var l=new p(t,e),u=h(r);do{if((s=d(t,o,n,e))<u){var f=r;f>u&&(f=u),c(t,o,o+f,o+s,e),s=f;}l.pushRun(o,s),l.mergeRuns(),r-=s,o+=s;}while(0!==r);l.forceMergeRuns();}}}}(e);}));function Hf(t){var e=function(){if("undefined"==typeof Reflect||!rl)return !1;if(rl.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(rl(Date,[],(function(){}))),!0}catch(t){return !1}}();return function(){var i,o=fl(t);if(e){var n=fl(this).constructor;i=rl(o,arguments,n);}else i=o.apply(this,arguments);return cl(this,i)}}var Wf=function(){function t(){Kh(this,t);}return Zh(t,[{key:"abstract",value:function(){throw new Error("Can't instantiate abstract class!")}},{key:"fake_use",value:function(){}},{key:"curveType",value:function(){return this.abstract()}},{key:"getPosition",value:function(t){return this.fake_use(t),this.abstract()}},{key:"setPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;this.fake_use(t,e,i),this.abstract();}},{key:"getTreeSize",value:function(t){return this.fake_use(t),this.abstract()}},{key:"sort",value:function(t){this.fake_use(t),this.abstract();}},{key:"fix",value:function(t,e){this.fake_use(t,e),this.abstract();}},{key:"shift",value:function(t,e){this.fake_use(t,e),this.abstract();}}]),t}(),Vf=function(t){dl(i,t);var e=Hf(i);function i(t){var o;return Kh(this,i),(o=e.call(this)).layout=t,o}return Zh(i,[{key:"curveType",value:function(){return "horizontal"}},{key:"getPosition",value:function(t){return t.x}},{key:"setPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;void 0!==i&&this.layout.hierarchical.addToOrdering(t,i),t.x=e;}},{key:"getTreeSize",value:function(t){var e=this.layout.hierarchical.getTreeSize(this.layout.body.nodes,t);return {min:e.min_x,max:e.max_x}}},{key:"sort",value:function(t){Lf.sort(t,(function(t,e){return t.x-e.x}));}},{key:"fix",value:function(t,e){t.y=this.layout.options.hierarchical.levelSeparation*e,t.options.fixed.y=!0;}},{key:"shift",value:function(t,e){this.layout.body.nodes[t].x+=e;}}]),i}(Wf),qf=function(t){dl(i,t);var e=Hf(i);function i(t){var o;return Kh(this,i),(o=e.call(this)).layout=t,o}return Zh(i,[{key:"curveType",value:function(){return "vertical"}},{key:"getPosition",value:function(t){return t.y}},{key:"setPosition",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:void 0;void 0!==i&&this.layout.hierarchical.addToOrdering(t,i),t.y=e;}},{key:"getTreeSize",value:function(t){var e=this.layout.hierarchical.getTreeSize(this.layout.body.nodes,t);return {min:e.min_y,max:e.max_y}}},{key:"sort",value:function(t){Lf.sort(t,(function(t,e){return t.y-e.y}));}},{key:"fix",value:function(t,e){t.x=this.layout.options.hierarchical.levelSeparation*e,t.options.fixed.x=!0;}},{key:"shift",value:function(t,e){this.layout.body.nodes[t].y+=e;}}]),i}(Wf),Uf=Ue.every,Yf=Io("every"),Xf=No("every");q({target:"Array",proto:!0,forced:!Yf||!Xf},{every:function(t){return Uf(this,t,arguments.length>1?arguments[1]:void 0)}});var Gf=K("Array").every,Kf=Array.prototype,$f=function(t){var e=t.every;return t===Kf||t instanceof Array&&e===Kf.every?Gf:e};function Zf(t,e){var i;if(void 0===wr||null==ro(t)){if(dr(t)||(i=function(t,e){var i;if(!t)return;if("string"==typeof t)return Qf(t,e);var o=ur(i=Object.prototype.toString.call(t)).call(i,8,-1);"Object"===o&&t.constructor&&(o=t.constructor.name);if("Map"===o||"Set"===o)return mo(t);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return Qf(t,e)}(t))||e&&t&&"number"==typeof t.length){i&&(t=i);var o=0,n=function(){};return {s:n,n:function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}},e:function(t){throw t},f:n}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var r,s=!0,a=!1;return {s:function(){i=no(t);},n:function(){var t=i.next();return s=t.done,t},e:function(t){a=!0,r=t;},f:function(){try{s||null==i.return||i.return();}finally{if(a)throw r}}}}function Qf(t,e){(null==e||e>t.length)&&(e=t.length);for(var i=0,o=new Array(e);i<e;i++)o[i]=t[i];return o}function Jf(t,e){var i=new uf;return qo(t).call(t,(function(t){var e;qo(e=t.edges).call(e,(function(t){t.connected&&i.add(t);}));})),qo(i).call(i,(function(t){var i=t.from.id,o=t.to.id;null==e[i]&&(e[i]=0),(null==e[o]||e[i]>=e[o])&&(e[o]=e[i]+1);})),e}function tp(t,e,i,o){var n,r,s=ko(null),a=Pf(n=gr(Gd(o).call(o))).call(n,(function(t,e){return t+1+e.edges.length}),0),h=i+"Id",d="to"===i?1:-1,l=Zf(o);try{var c=function(){var n=Jn(r.value,2),l=n[0],c=n[1];if(!o.has(l)||!t(c))return "continue";s[l]=0;for(var u=[c],f=0,p=void 0,v=function(){var t,n;if(!o.has(l))return "continue";var r=s[p.id]+d;if(qo(t=pn(n=p.edges).call(n,(function(t){return t.connected&&t.to!==t.from&&t[i]!==p&&o.has(t.toId)&&o.has(t.fromId)}))).call(t,(function(t){var o=t[h],n=s[o];(null==n||e(r,n))&&(s[o]=r,u.push(t[i]));})),f>a)return {v:{v:Jf(o,s)}};++f;};p=u.pop();){var g=v();if("continue"!==g&&"object"===cr(g))return g.v}};for(l.s();!(r=l.n()).done;){var u=c();if("continue"!==u&&"object"===cr(u))return u.v}}catch(t){l.e(t);}finally{l.f();}return s}var ep=function(){function t(){Kh(this,t),this.childrenReference={},this.parentReference={},this.trees={},this.distributionOrdering={},this.levels={},this.distributionIndex={},this.isTree=!1,this.treeIndex=-1;}return Zh(t,[{key:"addRelation",value:function(t,e){void 0===this.childrenReference[t]&&(this.childrenReference[t]=[]),this.childrenReference[t].push(e),void 0===this.parentReference[e]&&(this.parentReference[e]=[]),this.parentReference[e].push(t);}},{key:"checkIfTree",value:function(){for(var t in this.parentReference)if(this.parentReference[t].length>1)return void(this.isTree=!1);this.isTree=!0;}},{key:"numTrees",value:function(){return this.treeIndex+1}},{key:"setTreeIndex",value:function(t,e){void 0!==e&&void 0===this.trees[t.id]&&(this.trees[t.id]=e,this.treeIndex=Math.max(e,this.treeIndex));}},{key:"ensureLevel",value:function(t){void 0===this.levels[t]&&(this.levels[t]=0);}},{key:"getMaxLevel",value:function(t){var e=this,i={};return function t(o){if(void 0!==i[o])return i[o];var n=e.levels[o];if(e.childrenReference[o]){var r=e.childrenReference[o];if(r.length>0)for(var s=0;s<r.length;s++)n=Math.max(n,t(r[s]));}return i[o]=n,n}(t)}},{key:"levelDownstream",value:function(t,e){void 0===this.levels[e.id]&&(void 0===this.levels[t.id]&&(this.levels[t.id]=0),this.levels[e.id]=this.levels[t.id]+1);}},{key:"setMinLevelToZero",value:function(t){var e=1e9;for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&void 0!==this.levels[i]&&(e=Math.min(this.levels[i],e));for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&void 0!==this.levels[o]&&(this.levels[o]-=e);}},{key:"getTreeSize",value:function(t,e){var i=1e9,o=-1e9,n=1e9,r=-1e9;for(var s in this.trees)if(Object.prototype.hasOwnProperty.call(this.trees,s)&&this.trees[s]===e){var a=t[s];i=Math.min(a.x,i),o=Math.max(a.x,o),n=Math.min(a.y,n),r=Math.max(a.y,r);}return {min_x:i,max_x:o,min_y:n,max_y:r}}},{key:"hasSameParent",value:function(t,e){var i=this.parentReference[t.id],o=this.parentReference[e.id];if(void 0===i||void 0===o)return !1;for(var n=0;n<i.length;n++)for(var r=0;r<o.length;r++)if(i[n]==o[r])return !0;return !1}},{key:"inSameSubNetwork",value:function(t,e){return this.trees[t.id]===this.trees[e.id]}},{key:"getLevels",value:function(){return ir(this.distributionOrdering)}},{key:"addToOrdering",value:function(t,e){void 0===this.distributionOrdering[e]&&(this.distributionOrdering[e]=[]);var i=!1,o=this.distributionOrdering[e];for(var n in o)if(o[n]===t){i=!0;break}i||(this.distributionOrdering[e].push(t),this.distributionIndex[t.id]=this.distributionOrdering[e].length-1);}}]),t}(),ip=function(){function t(e){Kh(this,t),this.body=e,this._resetRNG(Math.random()+":"+tr()),this.setPhysics=!1,this.options={},this.optionsBackup={physics:{}},this.defaultOptions={randomSeed:void 0,improvedLayout:!0,clusterThreshold:150,hierarchical:{enabled:!1,levelSeparation:150,nodeSpacing:100,treeSpacing:200,blockShifting:!0,edgeMinimization:!0,parentCentralization:!0,direction:"UD",sortMethod:"hubsize"}},bt(this.options,this.defaultOptions),this.bindEventListeners();}return Zh(t,[{key:"bindEventListeners",value:function(){var t=this;this.body.emitter.on("_dataChanged",(function(){t.setupHierarchicalLayout();})),this.body.emitter.on("_dataLoaded",(function(){t.layoutNetwork();})),this.body.emitter.on("_resetHierarchicalLayout",(function(){t.setupHierarchicalLayout();})),this.body.emitter.on("_adjustEdgesForHierarchicalLayout",(function(){if(!0===t.options.hierarchical.enabled){var e=t.direction.curveType();t.body.emitter.emit("_forceDisableDynamicCurves",e,!1);}}));}},{key:"setOptions",value:function(t,e){if(void 0!==t){var i=this.options.hierarchical,o=i.enabled;if(Fr(["randomSeed","improvedLayout","clusterThreshold"],this.options,t),Jr(this.options,t,"hierarchical"),void 0!==t.randomSeed&&this._resetRNG(t.randomSeed),!0===i.enabled)return !0===o&&this.body.emitter.emit("refresh",!0),"RL"===i.direction||"DU"===i.direction?i.levelSeparation>0&&(i.levelSeparation*=-1):i.levelSeparation<0&&(i.levelSeparation*=-1),this.setDirectionStrategy(),this.body.emitter.emit("_resetHierarchicalLayout"),this.adaptAllOptionsForHierarchicalLayout(e);if(!0===o)return this.body.emitter.emit("refresh"),Ar(e,this.optionsBackup)}return e}},{key:"_resetRNG",value:function(t){this.initialRandomSeed=t,this._rng=xr(this.initialRandomSeed);}},{key:"adaptAllOptionsForHierarchicalLayout",value:function(t){if(!0===this.options.hierarchical.enabled){var e=this.optionsBackup.physics;void 0===t.physics||!0===t.physics?(t.physics={enabled:void 0===e.enabled||e.enabled,solver:"hierarchicalRepulsion"},e.enabled=void 0===e.enabled||e.enabled,e.solver=e.solver||"barnesHut"):"object"===cr(t.physics)?(e.enabled=void 0===t.physics.enabled||t.physics.enabled,e.solver=t.physics.solver||"barnesHut",t.physics.solver="hierarchicalRepulsion"):!1!==t.physics&&(e.solver="barnesHut",t.physics={solver:"hierarchicalRepulsion"});var i=this.direction.curveType();if(void 0===t.edges)this.optionsBackup.edges={smooth:{enabled:!0,type:"dynamic"}},t.edges={smooth:!1};else if(void 0===t.edges.smooth)this.optionsBackup.edges={smooth:{enabled:!0,type:"dynamic"}},t.edges.smooth=!1;else if("boolean"==typeof t.edges.smooth)this.optionsBackup.edges={smooth:t.edges.smooth},t.edges.smooth={enabled:t.edges.smooth,type:i};else {var o=t.edges.smooth;void 0!==o.type&&"dynamic"!==o.type&&(i=o.type),this.optionsBackup.edges={smooth:{enabled:void 0===o.enabled||o.enabled,type:void 0===o.type?"dynamic":o.type,roundness:void 0===o.roundness?.5:o.roundness,forceDirection:void 0!==o.forceDirection&&o.forceDirection}},t.edges.smooth={enabled:void 0===o.enabled||o.enabled,type:i,roundness:void 0===o.roundness?.5:o.roundness,forceDirection:void 0!==o.forceDirection&&o.forceDirection};}this.body.emitter.emit("_forceDisableDynamicCurves",i);}return t}},{key:"positionInitially",value:function(t){if(!0!==this.options.hierarchical.enabled){this._resetRNG(this.initialRandomSeed);for(var e=t.length+50,i=0;i<t.length;i++){var o=t[i],n=2*Math.PI*this._rng();void 0===o.x&&(o.x=e*Math.cos(n)),void 0===o.y&&(o.y=e*Math.sin(n));}}}},{key:"layoutNetwork",value:function(){if(!0!==this.options.hierarchical.enabled&&!0===this.options.improvedLayout){for(var t=this.body.nodeIndices,e=0,i=0;i<t.length;i++){!0===this.body.nodes[t[i]].predefinedPosition&&(e+=1);}if(e<.5*t.length){var o=0,n=this.options.clusterThreshold,r={clusterNodeProperties:{shape:"ellipse",label:"",group:"",font:{multi:!1}},clusterEdgeProperties:{label:"",font:{multi:!1},smooth:{enabled:!1}}};if(t.length>n){for(var s=t.length;t.length>n&&o<=10;){o+=1;var a=t.length;if(o%3==0?this.body.modules.clustering.clusterBridges(r):this.body.modules.clustering.clusterOutliers(r),a==t.length&&o%3!=0)return this._declusterAll(),this.body.emitter.emit("_layoutFailed"),void console.info("This network could not be positioned by this version of the improved layout algorithm. Please disable improvedLayout for better performance.")}this.body.modules.kamadaKawai.setOptions({springLength:Math.max(150,2*s)});}o>10&&console.info("The clustering didn't succeed within the amount of interations allowed, progressing with partial result."),this.body.modules.kamadaKawai.solve(t,this.body.edgeIndices,!0),this._shiftToCenter();for(var h=0;h<t.length;h++){var d=this.body.nodes[t[h]];!1===d.predefinedPosition&&(d.x+=70*(.5-this._rng()),d.y+=70*(.5-this._rng()));}this._declusterAll(),this.body.emitter.emit("_repositionBezierNodes");}}}},{key:"_shiftToCenter",value:function(){for(var t=Pu.getRangeCore(this.body.nodes,this.body.nodeIndices),e=Pu.findCenter(t),i=0;i<this.body.nodeIndices.length;i++){var o=this.body.nodes[this.body.nodeIndices[i]];o.x-=e.x,o.y-=e.y;}}},{key:"_declusterAll",value:function(){for(var t=!0;!0===t;){t=!1;for(var e=0;e<this.body.nodeIndices.length;e++)!0===this.body.nodes[this.body.nodeIndices[e]].isCluster&&(t=!0,this.body.modules.clustering.openCluster(this.body.nodeIndices[e],{},!1));!0===t&&this.body.emitter.emit("_dataChanged");}}},{key:"getSeed",value:function(){return this.initialRandomSeed}},{key:"setupHierarchicalLayout",value:function(){if(!0===this.options.hierarchical.enabled&&this.body.nodeIndices.length>0){var t,e,i=!1,o=!1;for(e in this.lastNodeOnLevel={},this.hierarchical=new ep,this.body.nodes)Object.prototype.hasOwnProperty.call(this.body.nodes,e)&&(void 0!==(t=this.body.nodes[e]).options.level?(i=!0,this.hierarchical.levels[e]=t.options.level):o=!0);if(!0===o&&!0===i)throw new Error("To use the hierarchical layout, nodes require either no predefined levels or levels have to be defined for all nodes.");if(!0===o){var n=this.options.hierarchical.sortMethod;"hubsize"===n?this._determineLevelsByHubsize():"directed"===n?this._determineLevelsDirected():"custom"===n&&this._determineLevelsCustomCallback();}for(var r in this.body.nodes)Object.prototype.hasOwnProperty.call(this.body.nodes,r)&&this.hierarchical.ensureLevel(r);var s=this._getDistribution();this._generateMap(),this._placeNodesByHierarchy(s),this._condenseHierarchy(),this._shiftToCenter();}}},{key:"_condenseHierarchy",value:function(){var t=this,e=!1,i={},o=function(e,i){var o=t.hierarchical.trees;for(var n in o)Object.prototype.hasOwnProperty.call(o,n)&&o[n]===e&&t.direction.shift(n,i);},n=function(){for(var e=[],i=0;i<t.hierarchical.numTrees();i++)e.push(t.direction.getTreeSize(i));return e},r=function e(i,o){if(!o[i.id]&&(o[i.id]=!0,t.hierarchical.childrenReference[i.id])){var n=t.hierarchical.childrenReference[i.id];if(n.length>0)for(var r=0;r<n.length;r++)e(t.body.nodes[n[r]],o);}},s=function(e){var i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1e9,o=1e9,n=1e9,r=1e9,s=-1e9;for(var a in e)if(Object.prototype.hasOwnProperty.call(e,a)){var h=t.body.nodes[a],d=t.hierarchical.levels[h.id],l=t.direction.getPosition(h),c=t._getSpaceAroundNode(h,e),u=Jn(c,2),f=u[0],p=u[1];o=Math.min(f,o),n=Math.min(p,n),d<=i&&(r=Math.min(l,r),s=Math.max(l,s));}return [r,s,o,n]},a=function(e,i){var o=t.hierarchical.getMaxLevel(e.id),n=t.hierarchical.getMaxLevel(i.id);return Math.min(o,n)},h=function(e,i,o){for(var n=t.hierarchical,r=0;r<i.length;r++){var s=i[r],a=n.distributionOrdering[s];if(a.length>1)for(var h=0;h<a.length-1;h++){var d=a[h],l=a[h+1];n.hasSameParent(d,l)&&n.inSameSubNetwork(d,l)&&e(d,l,o);}}},d=function(i,o){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],h=t.direction.getPosition(i),d=t.direction.getPosition(o),l=Math.abs(d-h),c=t.options.hierarchical.nodeSpacing;if(l>c){var u={},f={};r(i,u),r(o,f);var p=a(i,o),v=s(u,p),g=s(f,p),y=v[1],m=g[0],b=g[2],w=Math.abs(y-m);if(w>c){var k=y-m+c;k<-b+c&&(k=-b+c),k<0&&(t._shiftBlock(o.id,k),e=!0,!0===n&&t._centerParent(o));}}},l=function(o,n){for(var a=n.id,h=n.edges,d=t.hierarchical.levels[n.id],l=t.options.hierarchical.levelSeparation*t.options.hierarchical.levelSeparation,c={},u=[],f=0;f<h.length;f++){var p=h[f];if(p.toId!=p.fromId){var v=p.toId==a?p.from:p.to;c[h[f].id]=v,t.hierarchical.levels[v.id]<d&&u.push(p);}}var g=function(e,i){for(var o=0,n=0;n<i.length;n++)if(void 0!==c[i[n].id]){var r=t.direction.getPosition(c[i[n].id])-e;o+=r/Math.sqrt(r*r+l);}return o},y=function(e,i){for(var o=0,n=0;n<i.length;n++)if(void 0!==c[i[n].id]){var r=t.direction.getPosition(c[i[n].id])-e;o-=l*Math.pow(r*r+l,-1.5);}return o},m=function(e,i){for(var o=t.direction.getPosition(n),r={},s=0;s<e;s++){var a=g(o,i),h=y(o,i);if(void 0!==r[o-=Math.max(-40,Math.min(40,Math.round(a/h)))])break;r[o]=s;}return o},b=m(o,u);!function(o){var a=t.direction.getPosition(n);if(void 0===i[n.id]){var h={};r(n,h),i[n.id]=h;}var d=s(i[n.id]),l=d[2],c=d[3],u=o-a,f=0;u>0?f=Math.min(u,c-t.options.hierarchical.nodeSpacing):u<0&&(f=-Math.min(-u,l-t.options.hierarchical.nodeSpacing)),0!=f&&(t._shiftBlock(n.id,f),e=!0);}(b),function(i){var o=t.direction.getPosition(n),r=t._getSpaceAroundNode(n),s=Jn(r,2),a=s[0],h=s[1],d=i-o,l=o;d>0?l=Math.min(o+(h-t.options.hierarchical.nodeSpacing),i):d<0&&(l=Math.max(o-(a-t.options.hierarchical.nodeSpacing),i)),l!==o&&(t.direction.setPosition(n,l),e=!0);}(b=m(o,h));};!0===this.options.hierarchical.blockShifting&&(function(i){var o=t.hierarchical.getLevels();o=_u(o).call(o);for(var n=0;n<i&&(e=!1,h(d,o,!0),!0===e);n++);}(5),function(){for(var e in t.body.nodes)Object.prototype.hasOwnProperty.call(t.body.nodes,e)&&t._centerParent(t.body.nodes[e]);}()),!0===this.options.hierarchical.edgeMinimization&&function(i){var o=t.hierarchical.getLevels();o=_u(o).call(o);for(var n=0;n<i;n++){e=!1;for(var r=0;r<o.length;r++)for(var s=o[r],a=t.hierarchical.distributionOrdering[s],h=0;h<a.length;h++)l(1e3,a[h]);if(!0!==e)break}}(20),!0===this.options.hierarchical.parentCentralization&&function(){var e=t.hierarchical.getLevels();e=_u(e).call(e);for(var i=0;i<e.length;i++)for(var o=e[i],n=t.hierarchical.distributionOrdering[o],r=0;r<n.length;r++)t._centerParent(n[r]);}(),function(){for(var e=n(),i=0,r=0;r<e.length-1;r++){i+=e[r].max-e[r+1].min+t.options.hierarchical.treeSpacing,o(r+1,i);}}();}},{key:"_getSpaceAroundNode",value:function(t,e){var i=!0;void 0===e&&(i=!1);var o=this.hierarchical.levels[t.id];if(void 0!==o){var n=this.hierarchical.distributionIndex[t.id],r=this.direction.getPosition(t),s=this.hierarchical.distributionOrdering[o],a=1e9,h=1e9;if(0!==n){var d=s[n-1];if(!0===i&&void 0===e[d.id]||!1===i)a=r-this.direction.getPosition(d);}if(n!=s.length-1){var l=s[n+1];if(!0===i&&void 0===e[l.id]||!1===i){var c=this.direction.getPosition(l);h=Math.min(h,c-r);}}return [a,h]}return [0,0]}},{key:"_centerParent",value:function(t){if(this.hierarchical.parentReference[t.id])for(var e=this.hierarchical.parentReference[t.id],i=0;i<e.length;i++){var o=e[i],n=this.body.nodes[o],r=this.hierarchical.childrenReference[o];if(void 0!==r){var s=this._getCenterPosition(r),a=this.direction.getPosition(n),h=this._getSpaceAroundNode(n),d=Jn(h,2),l=d[0],c=d[1],u=a-s;(u<0&&Math.abs(u)<c-this.options.hierarchical.nodeSpacing||u>0&&Math.abs(u)<l-this.options.hierarchical.nodeSpacing)&&this.direction.setPosition(n,s);}}}},{key:"_placeNodesByHierarchy",value:function(t){for(var e in this.positionedNodes={},t)if(Object.prototype.hasOwnProperty.call(t,e)){var i,o=ir(t[e]);o=this._indexArrayToNodes(o),jf(i=this.direction).call(i,o);for(var n=0,r=0;r<o.length;r++){var s=o[r];if(void 0===this.positionedNodes[s.id]){var a=this.options.hierarchical.nodeSpacing,h=a*n;n>0&&(h=this.direction.getPosition(o[r-1])+a),this.direction.setPosition(s,h,e),this._validatePositionAndContinue(s,e,h),n++;}}}}},{key:"_placeBranchNodes",value:function(t,e){var i,o=this.hierarchical.childrenReference[t];if(void 0!==o){for(var n=[],r=0;r<o.length;r++)n.push(this.body.nodes[o[r]]);jf(i=this.direction).call(i,n);for(var s=0;s<n.length;s++){var a=n[s],h=this.hierarchical.levels[a.id];if(!(h>e&&void 0===this.positionedNodes[a.id]))return;var d=this.options.hierarchical.nodeSpacing,l=void 0;l=0===s?this.direction.getPosition(this.body.nodes[t]):this.direction.getPosition(n[s-1])+d,this.direction.setPosition(a,l,h),this._validatePositionAndContinue(a,h,l);}var c=this._getCenterPosition(n);this.direction.setPosition(this.body.nodes[t],c,e);}}},{key:"_validatePositionAndContinue",value:function(t,e,i){if(this.hierarchical.isTree){if(void 0!==this.lastNodeOnLevel[e]){var o=this.direction.getPosition(this.body.nodes[this.lastNodeOnLevel[e]]);if(i-o<this.options.hierarchical.nodeSpacing){var n=o+this.options.hierarchical.nodeSpacing-i,r=this._findCommonParent(this.lastNodeOnLevel[e],t.id);this._shiftBlock(r.withChild,n);}}this.lastNodeOnLevel[e]=t.id,this.positionedNodes[t.id]=!0,this._placeBranchNodes(t.id,e);}}},{key:"_indexArrayToNodes",value:function(t){for(var e=[],i=0;i<t.length;i++)e.push(this.body.nodes[t[i]]);return e}},{key:"_getDistribution",value:function(){var t,e,i={};for(t in this.body.nodes)if(Object.prototype.hasOwnProperty.call(this.body.nodes,t)){e=this.body.nodes[t];var o=void 0===this.hierarchical.levels[t]?0:this.hierarchical.levels[t];this.direction.fix(e,o),void 0===i[o]&&(i[o]={}),i[o][t]=e;}return i}},{key:"_getActiveEdges",value:function(t){var e=this,i=[];return Hr(t.edges,(function(t){var o;-1!==On(o=e.body.edgeIndices).call(o,t.id)&&i.push(t);})),i}},{key:"_getHubSizes",value:function(){var t=this,e={};Hr(this.body.nodeIndices,(function(i){var o=t.body.nodes[i],n=t._getActiveEdges(o).length;e[n]=!0;}));var i=[];return Hr(e,(function(t){i.push(Number(t));})),jf(Lf).call(Lf,i,(function(t,e){return e-t})),i}},{key:"_determineLevelsByHubsize",value:function(){for(var t=this,e=function(e,i){t.hierarchical.levelDownstream(e,i);},i=this._getHubSizes(),o=function(o){var n=i[o];if(0===n)return "break";Hr(t.body.nodeIndices,(function(i){var o=t.body.nodes[i];n===t._getActiveEdges(o).length&&t._crawlNetwork(e,i);}));},n=0;n<i.length;++n){if("break"===o(n))break}}},{key:"_determineLevelsCustomCallback",value:function(){var t=this;this._crawlNetwork((function(e,i,o){var n=t.hierarchical.levels[e.id];void 0===n&&(n=t.hierarchical.levels[e.id]=1e5);var r=(Pu.cloneOptions(e,"node"),Pu.cloneOptions(i,"node"),void Pu.cloneOptions(o,"edge"));t.hierarchical.levels[i.id]=n+r;})),this.hierarchical.setMinLevelToZero(this.body.nodes);}},{key:"_determineLevelsDirected",value:function(){var t,e=this,i=Pf(t=this.body.nodeIndices).call(t,(function(t,i){return t.set(i,e.body.nodes[i]),t}),new yd);"roots"===this.options.hierarchical.shakeTowards?this.hierarchical.levels=function(t){return tp((function(e){var i,o;return $f(i=pn(o=e.edges).call(o,(function(e){return t.has(e.toId)}))).call(i,(function(t){return t.from===e}))}),(function(t,e){return e<t}),"to",t)}(i):this.hierarchical.levels=function(t){return tp((function(e){var i,o;return $f(i=pn(o=e.edges).call(o,(function(e){return t.has(e.toId)}))).call(i,(function(t){return t.to===e}))}),(function(t,e){return e>t}),"from",t)}(i),this.hierarchical.setMinLevelToZero(this.body.nodes);}},{key:"_generateMap",value:function(){var t=this;this._crawlNetwork((function(e,i){t.hierarchical.levels[i.id]>t.hierarchical.levels[e.id]&&t.hierarchical.addRelation(e.id,i.id);})),this.hierarchical.checkIfTree();}},{key:"_crawlNetwork",value:function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:function(){},i=arguments.length>1?arguments[1]:void 0,o={},n=function i(n,r){if(void 0===o[n.id]){var s;t.hierarchical.setTreeIndex(n,r),o[n.id]=!0;for(var a=t._getActiveEdges(n),h=0;h<a.length;h++){var d=a[h];!0===d.connected&&(s=d.toId==n.id?d.from:d.to,n.id!=s.id&&(e(n,s,d),i(s,r)));}}};if(void 0===i)for(var r=0,s=0;s<this.body.nodeIndices.length;s++){var a=this.body.nodeIndices[s];if(void 0===o[a]){var h=this.body.nodes[a];n(h,r),r+=1;}}else {var d=this.body.nodes[i];if(void 0===d)return void console.error("Node not found:",i);n(d);}}},{key:"_shiftBlock",value:function(t,e){var i=this,o={};!function t(n){if(!o[n]){o[n]=!0,i.direction.shift(n,e);var r=i.hierarchical.childrenReference[n];if(void 0!==r)for(var s=0;s<r.length;s++)t(r[s]);}}(t);}},{key:"_findCommonParent",value:function(t,e){var i=this,o={};return function t(e,o){var n=i.hierarchical.parentReference[o];if(void 0!==n)for(var r=0;r<n.length;r++){var s=n[r];e[s]=!0,t(e,s);}}(o,t),function t(e,o){var n=i.hierarchical.parentReference[o];if(void 0!==n)for(var r=0;r<n.length;r++){var s=n[r];if(void 0!==e[s])return {foundParent:s,withChild:o};var a=t(e,s);if(null!==a.foundParent)return a}return {foundParent:null,withChild:o}}(o,e)}},{key:"setDirectionStrategy",value:function(){var t="UD"===this.options.hierarchical.direction||"DU"===this.options.hierarchical.direction;this.direction=t?new Vf(this):new qf(this);}},{key:"_getCenterPosition",value:function(t){for(var e=1e9,i=-1e9,o=0;o<t.length;o++){var n=void 0;if(void 0!==t[o].id)n=t[o];else {var r=t[o];n=this.body.nodes[r];}var s=this.direction.getPosition(n);e=Math.min(e,s),i=Math.max(i,s);}return .5*(e+i)}}]),t}(),op=function(){function t(e,i,o,n){var r,s,a=this;Kh(this,t),this.body=e,this.canvas=i,this.selectionHandler=o,this.interactionHandler=n,this.editMode=!1,this.manipulationDiv=void 0,this.editModeDiv=void 0,this.closeDiv=void 0,this.manipulationHammers=[],this.temporaryUIFunctions={},this.temporaryEventFunctions=[],this.touchTime=0,this.temporaryIds={nodes:[],edges:[]},this.guiEnabled=!1,this.inMode=!1,this.selectedControlNode=void 0,this.options={},this.defaultOptions={enabled:!1,initiallyActive:!1,addNode:!0,addEdge:!0,editNode:void 0,editEdge:!0,deleteNode:!0,deleteEdge:!0,controlNodeStyle:{shape:"dot",size:6,color:{background:"#ff0000",border:"#3c3c3c",highlight:{background:"#07f968",border:"#3c3c3c"}},borderWidth:2,borderWidthSelected:2}},bt(this.options,this.defaultOptions),this.body.emitter.on("destroy",(function(){a._clean();})),this.body.emitter.on("_dataChanged",Q(r=this._restore).call(r,this)),this.body.emitter.on("_resetData",Q(s=this._restore).call(s,this));}return Zh(t,[{key:"_restore",value:function(){!1!==this.inMode&&(!0===this.options.initiallyActive?this.enableEditMode():this.disableEditMode());}},{key:"setOptions",value:function(t,e,i){void 0!==e&&(void 0!==e.locale?this.options.locale=e.locale:this.options.locale=i.locale,void 0!==e.locales?this.options.locales=e.locales:this.options.locales=i.locales),void 0!==t&&("boolean"==typeof t?this.options.enabled=t:(this.options.enabled=!0,Ar(this.options,t)),!0===this.options.initiallyActive&&(this.editMode=!0),this._setup());}},{key:"toggleEditMode",value:function(){!0===this.editMode?this.disableEditMode():this.enableEditMode();}},{key:"enableEditMode",value:function(){this.editMode=!0,this._clean(),!0===this.guiEnabled&&(this.manipulationDiv.style.display="block",this.closeDiv.style.display="block",this.editModeDiv.style.display="none",this.showManipulatorToolbar());}},{key:"disableEditMode",value:function(){this.editMode=!1,this._clean(),!0===this.guiEnabled&&(this.manipulationDiv.style.display="none",this.closeDiv.style.display="none",this.editModeDiv.style.display="block",this._createEditButton());}},{key:"showManipulatorToolbar",value:function(){if(this._clean(),this.manipulationDOM={},!0===this.guiEnabled){var t,e;this.editMode=!0,this.manipulationDiv.style.display="block",this.closeDiv.style.display="block";var i=this.selectionHandler.getSelectedNodeCount(),o=this.selectionHandler.getSelectedEdgeCount(),n=i+o,r=this.options.locales[this.options.locale],s=!1;!1!==this.options.addNode&&(this._createAddNodeButton(r),s=!0),!1!==this.options.addEdge&&(!0===s?this._createSeperator(1):s=!0,this._createAddEdgeButton(r)),1===i&&"function"==typeof this.options.editNode?(!0===s?this._createSeperator(2):s=!0,this._createEditNodeButton(r)):1===o&&0===i&&!1!==this.options.editEdge&&(!0===s?this._createSeperator(3):s=!0,this._createEditEdgeButton(r)),0!==n&&(i>0&&!1!==this.options.deleteNode||0===i&&!1!==this.options.deleteEdge)&&(!0===s&&this._createSeperator(4),this._createDeleteButton(r)),this._bindHammerToDiv(this.closeDiv,Q(t=this.toggleEditMode).call(t,this)),this._temporaryBindEvent("select",Q(e=this.showManipulatorToolbar).call(e,this));}this.body.emitter.emit("_redraw");}},{key:"addNodeMode",value:function(){var t;if(!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="addNode",!0===this.guiEnabled){var e,i=this.options.locales[this.options.locale];this.manipulationDOM={},this._createBackButton(i),this._createSeperator(),this._createDescription(i.addDescription||this.options.locales.en.addDescription),this._bindHammerToDiv(this.closeDiv,Q(e=this.toggleEditMode).call(e,this));}this._temporaryBindEvent("click",Q(t=this._performAddNode).call(t,this));}},{key:"editNode",value:function(){var t=this;!0!==this.editMode&&this.enableEditMode(),this._clean();var e=this.selectionHandler.getSelectedNodes()[0];if(void 0!==e){if(this.inMode="editNode","function"!=typeof this.options.editNode)throw new Error("No function has been configured to handle the editing of nodes.");if(!0!==e.isCluster){var i=Ar({},e.options,!1);if(i.x=e.x,i.y=e.y,2!==this.options.editNode.length)throw new Error("The function for edit does not support two arguments (data, callback)");this.options.editNode(i,(function(e){null!=e&&"editNode"===t.inMode&&t.body.data.nodes.getDataSet().update(e),t.showManipulatorToolbar();}));}else alert(this.options.locales[this.options.locale].editClusterError||this.options.locales.en.editClusterError);}else this.showManipulatorToolbar();}},{key:"addEdgeMode",value:function(){var t,e,i,o,n;if(!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="addEdge",!0===this.guiEnabled){var r,s=this.options.locales[this.options.locale];this.manipulationDOM={},this._createBackButton(s),this._createSeperator(),this._createDescription(s.edgeDescription||this.options.locales.en.edgeDescription),this._bindHammerToDiv(this.closeDiv,Q(r=this.toggleEditMode).call(r,this));}this._temporaryBindUI("onTouch",Q(t=this._handleConnect).call(t,this)),this._temporaryBindUI("onDragEnd",Q(e=this._finishConnect).call(e,this)),this._temporaryBindUI("onDrag",Q(i=this._dragControlNode).call(i,this)),this._temporaryBindUI("onRelease",Q(o=this._finishConnect).call(o,this)),this._temporaryBindUI("onDragStart",Q(n=this._dragStartEdge).call(n,this)),this._temporaryBindUI("onHold",(function(){}));}},{key:"editEdgeMode",value:function(){if(!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="editEdge","object"!==cr(this.options.editEdge)||"function"!=typeof this.options.editEdge.editWithoutDrag||(this.edgeBeingEditedId=this.selectionHandler.getSelectedEdgeIds()[0],void 0===this.edgeBeingEditedId)){if(!0===this.guiEnabled){var t,e=this.options.locales[this.options.locale];this.manipulationDOM={},this._createBackButton(e),this._createSeperator(),this._createDescription(e.editEdgeDescription||this.options.locales.en.editEdgeDescription),this._bindHammerToDiv(this.closeDiv,Q(t=this.toggleEditMode).call(t,this));}if(this.edgeBeingEditedId=this.selectionHandler.getSelectedEdgeIds()[0],void 0!==this.edgeBeingEditedId){var i,o,n,r,s=this.body.edges[this.edgeBeingEditedId],a=this._getNewTargetNode(s.from.x,s.from.y),h=this._getNewTargetNode(s.to.x,s.to.y);this.temporaryIds.nodes.push(a.id),this.temporaryIds.nodes.push(h.id),this.body.nodes[a.id]=a,this.body.nodeIndices.push(a.id),this.body.nodes[h.id]=h,this.body.nodeIndices.push(h.id),this._temporaryBindUI("onTouch",Q(i=this._controlNodeTouch).call(i,this)),this._temporaryBindUI("onTap",(function(){})),this._temporaryBindUI("onHold",(function(){})),this._temporaryBindUI("onDragStart",Q(o=this._controlNodeDragStart).call(o,this)),this._temporaryBindUI("onDrag",Q(n=this._controlNodeDrag).call(n,this)),this._temporaryBindUI("onDragEnd",Q(r=this._controlNodeDragEnd).call(r,this)),this._temporaryBindUI("onMouseMove",(function(){})),this._temporaryBindEvent("beforeDrawing",(function(t){var e=s.edgeType.findBorderPositions(t);!1===a.selected&&(a.x=e.from.x,a.y=e.from.y),!1===h.selected&&(h.x=e.to.x,h.y=e.to.y);})),this.body.emitter.emit("_redraw");}else this.showManipulatorToolbar();}else {var d=this.body.edges[this.edgeBeingEditedId];this._performEditEdge(d.from.id,d.to.id);}}},{key:"deleteSelected",value:function(){var t=this;!0!==this.editMode&&this.enableEditMode(),this._clean(),this.inMode="delete";var e=this.selectionHandler.getSelectedNodeIds(),i=this.selectionHandler.getSelectedEdgeIds(),o=void 0;if(e.length>0){for(var n=0;n<e.length;n++)if(!0===this.body.nodes[e[n]].isCluster)return void alert(this.options.locales[this.options.locale].deleteClusterError||this.options.locales.en.deleteClusterError);"function"==typeof this.options.deleteNode&&(o=this.options.deleteNode);}else i.length>0&&"function"==typeof this.options.deleteEdge&&(o=this.options.deleteEdge);if("function"==typeof o){var r={nodes:e,edges:i};if(2!==o.length)throw new Error("The function for delete does not support two arguments (data, callback)");o(r,(function(e){null!=e&&"delete"===t.inMode?(t.body.data.edges.getDataSet().remove(e.edges),t.body.data.nodes.getDataSet().remove(e.nodes),t.body.emitter.emit("startSimulation"),t.showManipulatorToolbar()):(t.body.emitter.emit("startSimulation"),t.showManipulatorToolbar());}));}else this.body.data.edges.getDataSet().remove(i),this.body.data.nodes.getDataSet().remove(e),this.body.emitter.emit("startSimulation"),this.showManipulatorToolbar();}},{key:"_setup",value:function(){!0===this.options.enabled?(this.guiEnabled=!0,this._createWrappers(),!1===this.editMode?this._createEditButton():this.showManipulatorToolbar()):(this._removeManipulationDOM(),this.guiEnabled=!1);}},{key:"_createWrappers",value:function(){void 0===this.manipulationDiv&&(this.manipulationDiv=document.createElement("div"),this.manipulationDiv.className="vis-manipulation",!0===this.editMode?this.manipulationDiv.style.display="block":this.manipulationDiv.style.display="none",this.canvas.frame.appendChild(this.manipulationDiv)),void 0===this.editModeDiv&&(this.editModeDiv=document.createElement("div"),this.editModeDiv.className="vis-edit-mode",!0===this.editMode?this.editModeDiv.style.display="none":this.editModeDiv.style.display="block",this.canvas.frame.appendChild(this.editModeDiv)),void 0===this.closeDiv&&(this.closeDiv=document.createElement("div"),this.closeDiv.className="vis-close",this.closeDiv.style.display=this.manipulationDiv.style.display,this.canvas.frame.appendChild(this.closeDiv));}},{key:"_getNewTargetNode",value:function(t,e){var i=Ar({},this.options.controlNodeStyle);i.id="targetNode"+Du(),i.hidden=!1,i.physics=!1,i.x=t,i.y=e;var o=this.body.functions.createNode(i);return o.shape.boundingBox={left:t,right:t,top:e,bottom:e},o}},{key:"_createEditButton",value:function(){var t;this._clean(),this.manipulationDOM={},Dr(this.editModeDiv);var e=this.options.locales[this.options.locale],i=this._createButton("editMode","vis-button vis-edit vis-edit-mode",e.edit||this.options.locales.en.edit);this.editModeDiv.appendChild(i),this._bindHammerToDiv(i,Q(t=this.toggleEditMode).call(t,this));}},{key:"_clean",value:function(){this.inMode=!1,!0===this.guiEnabled&&(Dr(this.editModeDiv),Dr(this.manipulationDiv),this._cleanManipulatorHammers()),this._cleanupTemporaryNodesAndEdges(),this._unbindTemporaryUIs(),this._unbindTemporaryEvents(),this.body.emitter.emit("restorePhysics");}},{key:"_cleanManipulatorHammers",value:function(){if(0!=this.manipulationHammers.length){for(var t=0;t<this.manipulationHammers.length;t++)this.manipulationHammers[t].destroy();this.manipulationHammers=[];}}},{key:"_removeManipulationDOM",value:function(){this._clean(),Dr(this.manipulationDiv),Dr(this.editModeDiv),Dr(this.closeDiv),this.manipulationDiv&&this.canvas.frame.removeChild(this.manipulationDiv),this.editModeDiv&&this.canvas.frame.removeChild(this.editModeDiv),this.closeDiv&&this.canvas.frame.removeChild(this.closeDiv),this.manipulationDiv=void 0,this.editModeDiv=void 0,this.closeDiv=void 0;}},{key:"_createSeperator",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1;this.manipulationDOM["seperatorLineDiv"+t]=document.createElement("div"),this.manipulationDOM["seperatorLineDiv"+t].className="vis-separator-line",this.manipulationDiv.appendChild(this.manipulationDOM["seperatorLineDiv"+t]);}},{key:"_createAddNodeButton",value:function(t){var e,i=this._createButton("addNode","vis-button vis-add",t.addNode||this.options.locales.en.addNode);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,Q(e=this.addNodeMode).call(e,this));}},{key:"_createAddEdgeButton",value:function(t){var e,i=this._createButton("addEdge","vis-button vis-connect",t.addEdge||this.options.locales.en.addEdge);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,Q(e=this.addEdgeMode).call(e,this));}},{key:"_createEditNodeButton",value:function(t){var e,i=this._createButton("editNode","vis-button vis-edit",t.editNode||this.options.locales.en.editNode);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,Q(e=this.editNode).call(e,this));}},{key:"_createEditEdgeButton",value:function(t){var e,i=this._createButton("editEdge","vis-button vis-edit",t.editEdge||this.options.locales.en.editEdge);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,Q(e=this.editEdgeMode).call(e,this));}},{key:"_createDeleteButton",value:function(t){var e,i;i=this.options.rtl?"vis-button vis-delete-rtl":"vis-button vis-delete";var o=this._createButton("delete",i,t.del||this.options.locales.en.del);this.manipulationDiv.appendChild(o),this._bindHammerToDiv(o,Q(e=this.deleteSelected).call(e,this));}},{key:"_createBackButton",value:function(t){var e,i=this._createButton("back","vis-button vis-back",t.back||this.options.locales.en.back);this.manipulationDiv.appendChild(i),this._bindHammerToDiv(i,Q(e=this.showManipulatorToolbar).call(e,this));}},{key:"_createButton",value:function(t,e,i){var o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"vis-label";return this.manipulationDOM[t+"Div"]=document.createElement("div"),this.manipulationDOM[t+"Div"].className=e,this.manipulationDOM[t+"Label"]=document.createElement("div"),this.manipulationDOM[t+"Label"].className=o,this.manipulationDOM[t+"Label"].innerHTML=i,this.manipulationDOM[t+"Div"].appendChild(this.manipulationDOM[t+"Label"]),this.manipulationDOM[t+"Div"]}},{key:"_createDescription",value:function(t){this.manipulationDiv.appendChild(this._createButton("description","vis-button vis-none",t));}},{key:"_temporaryBindEvent",value:function(t,e){this.temporaryEventFunctions.push({event:t,boundFunction:e}),this.body.emitter.on(t,e);}},{key:"_temporaryBindUI",value:function(t,e){if(void 0===this.body.eventListeners[t])throw new Error("This UI function does not exist. Typo? You tried: "+t+" possible are: "+dc(ir(this.body.eventListeners)));this.temporaryUIFunctions[t]=this.body.eventListeners[t],this.body.eventListeners[t]=e;}},{key:"_unbindTemporaryUIs",value:function(){for(var t in this.temporaryUIFunctions)Object.prototype.hasOwnProperty.call(this.temporaryUIFunctions,t)&&(this.body.eventListeners[t]=this.temporaryUIFunctions[t],delete this.temporaryUIFunctions[t]);this.temporaryUIFunctions={};}},{key:"_unbindTemporaryEvents",value:function(){for(var t=0;t<this.temporaryEventFunctions.length;t++){var e=this.temporaryEventFunctions[t].event,i=this.temporaryEventFunctions[t].boundFunction;this.body.emitter.off(e,i);}this.temporaryEventFunctions=[];}},{key:"_bindHammerToDiv",value:function(t,e){var i=new Yh(t,{});ju(i,e),this.manipulationHammers.push(i);}},{key:"_cleanupTemporaryNodesAndEdges",value:function(){for(var t=0;t<this.temporaryIds.edges.length;t++){var e;this.body.edges[this.temporaryIds.edges[t]].disconnect(),delete this.body.edges[this.temporaryIds.edges[t]];var i,o=On(e=this.body.edgeIndices).call(e,this.temporaryIds.edges[t]);if(-1!==o)ls(i=this.body.edgeIndices).call(i,o,1);}for(var n=0;n<this.temporaryIds.nodes.length;n++){var r;delete this.body.nodes[this.temporaryIds.nodes[n]];var s,a=On(r=this.body.nodeIndices).call(r,this.temporaryIds.nodes[n]);if(-1!==a)ls(s=this.body.nodeIndices).call(s,a,1);}this.temporaryIds={nodes:[],edges:[]};}},{key:"_controlNodeTouch",value:function(t){this.selectionHandler.unselectAll(),this.lastTouch=this.body.functions.getPointer(t.center),this.lastTouch.translation=bt({},this.body.view.translation);}},{key:"_controlNodeDragStart",value:function(){var t=this.lastTouch,e=this.selectionHandler._pointerToPositionObject(t),i=this.body.nodes[this.temporaryIds.nodes[0]],o=this.body.nodes[this.temporaryIds.nodes[1]],n=this.body.edges[this.edgeBeingEditedId];this.selectedControlNode=void 0;var r=i.isOverlappingWith(e),s=o.isOverlappingWith(e);!0===r?(this.selectedControlNode=i,n.edgeType.from=i):!0===s&&(this.selectedControlNode=o,n.edgeType.to=o),void 0!==this.selectedControlNode&&this.selectionHandler.selectObject(this.selectedControlNode),this.body.emitter.emit("_redraw");}},{key:"_controlNodeDrag",value:function(t){this.body.emitter.emit("disablePhysics");var e=this.body.functions.getPointer(t.center),i=this.canvas.DOMtoCanvas(e);void 0!==this.selectedControlNode?(this.selectedControlNode.x=i.x,this.selectedControlNode.y=i.y):this.interactionHandler.onDrag(t),this.body.emitter.emit("_redraw");}},{key:"_controlNodeDragEnd",value:function(t){var e=this.body.functions.getPointer(t.center),i=this.selectionHandler._pointerToPositionObject(e),o=this.body.edges[this.edgeBeingEditedId];if(void 0!==this.selectedControlNode){this.selectionHandler.unselectAll();for(var n=this.selectionHandler._getAllNodesOverlappingWith(i),r=void 0,s=n.length-1;s>=0;s--)if(n[s]!==this.selectedControlNode.id){r=this.body.nodes[n[s]];break}if(void 0!==r&&void 0!==this.selectedControlNode)if(!0===r.isCluster)alert(this.options.locales[this.options.locale].createEdgeError||this.options.locales.en.createEdgeError);else {var a=this.body.nodes[this.temporaryIds.nodes[0]];this.selectedControlNode.id===a.id?this._performEditEdge(r.id,o.to.id):this._performEditEdge(o.from.id,r.id);}else o.updateEdgeType(),this.body.emitter.emit("restorePhysics");this.body.emitter.emit("_redraw");}}},{key:"_handleConnect",value:function(t){if((new Date).valueOf()-this.touchTime>100){this.lastTouch=this.body.functions.getPointer(t.center),this.lastTouch.translation=bt({},this.body.view.translation),this.interactionHandler.drag.pointer=this.lastTouch,this.interactionHandler.drag.translation=this.lastTouch.translation;var e=this.lastTouch,i=this.selectionHandler.getNodeAt(e);if(void 0!==i)if(!0===i.isCluster)alert(this.options.locales[this.options.locale].createEdgeError||this.options.locales.en.createEdgeError);else {var o=this._getNewTargetNode(i.x,i.y);this.body.nodes[o.id]=o,this.body.nodeIndices.push(o.id);var n=this.body.functions.createEdge({id:"connectionEdge"+Du(),from:i.id,to:o.id,physics:!1,smooth:{enabled:!0,type:"continuous",roundness:.5}});this.body.edges[n.id]=n,this.body.edgeIndices.push(n.id),this.temporaryIds.nodes.push(o.id),this.temporaryIds.edges.push(n.id);}this.touchTime=(new Date).valueOf();}}},{key:"_dragControlNode",value:function(t){var e=this.body.functions.getPointer(t.center),i=this.selectionHandler._pointerToPositionObject(e),o=void 0;void 0!==this.temporaryIds.edges[0]&&(o=this.body.edges[this.temporaryIds.edges[0]].fromId);for(var n=this.selectionHandler._getAllNodesOverlappingWith(i),r=void 0,s=n.length-1;s>=0;s--){var a;if(-1===On(a=this.temporaryIds.nodes).call(a,n[s])){r=this.body.nodes[n[s]];break}}if(t.controlEdge={from:o,to:r?r.id:void 0},this.selectionHandler.generateClickEvent("controlNodeDragging",t,e),void 0!==this.temporaryIds.nodes[0]){var h=this.body.nodes[this.temporaryIds.nodes[0]];h.x=this.canvas._XconvertDOMtoCanvas(e.x),h.y=this.canvas._YconvertDOMtoCanvas(e.y),this.body.emitter.emit("_redraw");}else this.interactionHandler.onDrag(t);}},{key:"_finishConnect",value:function(t){var e=this.body.functions.getPointer(t.center),i=this.selectionHandler._pointerToPositionObject(e),o=void 0;void 0!==this.temporaryIds.edges[0]&&(o=this.body.edges[this.temporaryIds.edges[0]].fromId);for(var n=this.selectionHandler._getAllNodesOverlappingWith(i),r=void 0,s=n.length-1;s>=0;s--){var a;if(-1===On(a=this.temporaryIds.nodes).call(a,n[s])){r=this.body.nodes[n[s]];break}}this._cleanupTemporaryNodesAndEdges(),void 0!==r&&(!0===r.isCluster?alert(this.options.locales[this.options.locale].createEdgeError||this.options.locales.en.createEdgeError):void 0!==this.body.nodes[o]&&void 0!==this.body.nodes[r.id]&&this._performAddEdge(o,r.id)),t.controlEdge={from:o,to:r?r.id:void 0},this.selectionHandler.generateClickEvent("controlNodeDragEnd",t,e),this.body.emitter.emit("_redraw");}},{key:"_dragStartEdge",value:function(t){var e=this.lastTouch;this.selectionHandler.generateClickEvent("dragStart",t,e,void 0,!0);}},{key:"_performAddNode",value:function(t){var e=this,i={id:Du(),x:t.pointer.canvas.x,y:t.pointer.canvas.y,label:"new"};if("function"==typeof this.options.addNode){if(2!==this.options.addNode.length)throw this.showManipulatorToolbar(),new Error("The function for add does not support two arguments (data,callback)");this.options.addNode(i,(function(t){null!=t&&"addNode"===e.inMode&&e.body.data.nodes.getDataSet().add(t),e.showManipulatorToolbar();}));}else this.body.data.nodes.getDataSet().add(i),this.showManipulatorToolbar();}},{key:"_performAddEdge",value:function(t,e){var i=this,o={from:t,to:e};if("function"==typeof this.options.addEdge){if(2!==this.options.addEdge.length)throw new Error("The function for connect does not support two arguments (data,callback)");this.options.addEdge(o,(function(t){null!=t&&"addEdge"===i.inMode&&(i.body.data.edges.getDataSet().add(t),i.selectionHandler.unselectAll(),i.showManipulatorToolbar());}));}else this.body.data.edges.getDataSet().add(o),this.selectionHandler.unselectAll(),this.showManipulatorToolbar();}},{key:"_performEditEdge",value:function(t,e){var i=this,o={id:this.edgeBeingEditedId,from:t,to:e,label:this.body.data.edges.get(this.edgeBeingEditedId).label},n=this.options.editEdge;if("object"===cr(n)&&(n=n.editWithoutDrag),"function"==typeof n){if(2!==n.length)throw new Error("The function for edit does not support two arguments (data, callback)");n(o,(function(t){null==t||"editEdge"!==i.inMode?(i.body.edges[o.id].updateEdgeType(),i.body.emitter.emit("_redraw"),i.showManipulatorToolbar()):(i.body.data.edges.getDataSet().update(t),i.selectionHandler.unselectAll(),i.showManipulatorToolbar());}));}else this.body.data.edges.getDataSet().update(o),this.selectionHandler.unselectAll(),this.showManipulatorToolbar();}}]),t}(),np={black:"#000000",navy:"#000080",darkblue:"#00008B",mediumblue:"#0000CD",blue:"#0000FF",darkgreen:"#006400",green:"#008000",teal:"#008080",darkcyan:"#008B8B",deepskyblue:"#00BFFF",darkturquoise:"#00CED1",mediumspringgreen:"#00FA9A",lime:"#00FF00",springgreen:"#00FF7F",aqua:"#00FFFF",cyan:"#00FFFF",midnightblue:"#191970",dodgerblue:"#1E90FF",lightseagreen:"#20B2AA",forestgreen:"#228B22",seagreen:"#2E8B57",darkslategray:"#2F4F4F",limegreen:"#32CD32",mediumseagreen:"#3CB371",turquoise:"#40E0D0",royalblue:"#4169E1",steelblue:"#4682B4",darkslateblue:"#483D8B",mediumturquoise:"#48D1CC",indigo:"#4B0082",darkolivegreen:"#556B2F",cadetblue:"#5F9EA0",cornflowerblue:"#6495ED",mediumaquamarine:"#66CDAA",dimgray:"#696969",slateblue:"#6A5ACD",olivedrab:"#6B8E23",slategray:"#708090",lightslategray:"#778899",mediumslateblue:"#7B68EE",lawngreen:"#7CFC00",chartreuse:"#7FFF00",aquamarine:"#7FFFD4",maroon:"#800000",purple:"#800080",olive:"#808000",gray:"#808080",skyblue:"#87CEEB",lightskyblue:"#87CEFA",blueviolet:"#8A2BE2",darkred:"#8B0000",darkmagenta:"#8B008B",saddlebrown:"#8B4513",darkseagreen:"#8FBC8F",lightgreen:"#90EE90",mediumpurple:"#9370D8",darkviolet:"#9400D3",palegreen:"#98FB98",darkorchid:"#9932CC",yellowgreen:"#9ACD32",sienna:"#A0522D",brown:"#A52A2A",darkgray:"#A9A9A9",lightblue:"#ADD8E6",greenyellow:"#ADFF2F",paleturquoise:"#AFEEEE",lightsteelblue:"#B0C4DE",powderblue:"#B0E0E6",firebrick:"#B22222",darkgoldenrod:"#B8860B",mediumorchid:"#BA55D3",rosybrown:"#BC8F8F",darkkhaki:"#BDB76B",silver:"#C0C0C0",mediumvioletred:"#C71585",indianred:"#CD5C5C",peru:"#CD853F",chocolate:"#D2691E",tan:"#D2B48C",lightgrey:"#D3D3D3",palevioletred:"#D87093",thistle:"#D8BFD8",orchid:"#DA70D6",goldenrod:"#DAA520",crimson:"#DC143C",gainsboro:"#DCDCDC",plum:"#DDA0DD",burlywood:"#DEB887",lightcyan:"#E0FFFF",lavender:"#E6E6FA",darksalmon:"#E9967A",violet:"#EE82EE",palegoldenrod:"#EEE8AA",lightcoral:"#F08080",khaki:"#F0E68C",aliceblue:"#F0F8FF",honeydew:"#F0FFF0",azure:"#F0FFFF",sandybrown:"#F4A460",wheat:"#F5DEB3",beige:"#F5F5DC",whitesmoke:"#F5F5F5",mintcream:"#F5FFFA",ghostwhite:"#F8F8FF",salmon:"#FA8072",antiquewhite:"#FAEBD7",linen:"#FAF0E6",lightgoldenrodyellow:"#FAFAD2",oldlace:"#FDF5E6",red:"#FF0000",fuchsia:"#FF00FF",magenta:"#FF00FF",deeppink:"#FF1493",orangered:"#FF4500",tomato:"#FF6347",hotpink:"#FF69B4",coral:"#FF7F50",darkorange:"#FF8C00",lightsalmon:"#FFA07A",orange:"#FFA500",lightpink:"#FFB6C1",pink:"#FFC0CB",gold:"#FFD700",peachpuff:"#FFDAB9",navajowhite:"#FFDEAD",moccasin:"#FFE4B5",bisque:"#FFE4C4",mistyrose:"#FFE4E1",blanchedalmond:"#FFEBCD",papayawhip:"#FFEFD5",lavenderblush:"#FFF0F5",seashell:"#FFF5EE",cornsilk:"#FFF8DC",lemonchiffon:"#FFFACD",floralwhite:"#FFFAF0",snow:"#FFFAFA",yellow:"#FFFF00",lightyellow:"#FFFFE0",ivory:"#FFFFF0",white:"#FFFFFF"},rp=function(){function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1;Kh(this,t),this.pixelRatio=e,this.generated=!1,this.centerCoordinates={x:144.5,y:144.5},this.r=289*.49,this.color={r:255,g:255,b:255,a:1},this.hueCircle=void 0,this.initialColor={r:255,g:255,b:255,a:1},this.previousColor=void 0,this.applied=!1,this.updateCallback=function(){},this.closeCallback=function(){},this._create();}return Zh(t,[{key:"insertTo",value:function(t){void 0!==this.hammer&&(this.hammer.destroy(),this.hammer=void 0),this.container=t,this.container.appendChild(this.frame),this._bindHammer(),this._setSize();}},{key:"setUpdateCallback",value:function(t){if("function"!=typeof t)throw new Error("Function attempted to set as colorPicker update callback is not a function.");this.updateCallback=t;}},{key:"setCloseCallback",value:function(t){if("function"!=typeof t)throw new Error("Function attempted to set as colorPicker closing callback is not a function.");this.closeCallback=t;}},{key:"_isColorString",value:function(t){if("string"==typeof t)return np[t]}},{key:"setColor",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if("none"!==t){var i,o=this._isColorString(t);if(void 0!==o&&(t=o),!0===Pr(t)){if(!0===$r(t)){var n=t.substr(4).substr(0,t.length-5).split(",");i={r:n[0],g:n[1],b:n[2],a:1};}else if(!0===Zr(t)){var r=t.substr(5).substr(0,t.length-6).split(",");i={r:r[0],g:r[1],b:r[2],a:r[3]};}else if(!0===Kr(t)){var s=Wr(t);i={r:s.r,g:s.g,b:s.b,a:1};}}else if(t instanceof Object&&void 0!==t.r&&void 0!==t.g&&void 0!==t.b){var a=void 0!==t.a?t.a:"1.0";i={r:t.r,g:t.g,b:t.b,a:a};}if(void 0===i)throw new Error("Unknown color passed to the colorPicker. Supported are strings: rgb, hex, rgba. Object: rgb ({r:r,g:g,b:b,[a:a]}). Supplied: "+dc(t));this._setColor(i,e);}}},{key:"show",value:function(){void 0!==this.closeCallback&&(this.closeCallback(),this.closeCallback=void 0),this.applied=!1,this.frame.style.display="block",this._generateHueCircle();}},{key:"_hide",value:function(){var t=this,e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];!0===e&&(this.previousColor=bt({},this.color)),!0===this.applied&&this.updateCallback(this.initialColor),this.frame.style.display="none",_d((function(){void 0!==t.closeCallback&&(t.closeCallback(),t.closeCallback=void 0);}),0);}},{key:"_save",value:function(){this.updateCallback(this.color),this.applied=!1,this._hide();}},{key:"_apply",value:function(){this.applied=!0,this.updateCallback(this.color),this._updatePicker(this.color);}},{key:"_loadLast",value:function(){void 0!==this.previousColor?this.setColor(this.previousColor,!1):alert("There is no last color to load...");}},{key:"_setColor",value:function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];!0===e&&(this.initialColor=bt({},t)),this.color=t;var i=Yr(t.r,t.g,t.b),o=2*Math.PI,n=this.r*i.s,r=this.centerCoordinates.x+n*Math.sin(o*i.h),s=this.centerCoordinates.y+n*Math.cos(o*i.h);this.colorPickerSelector.style.left=r-.5*this.colorPickerSelector.clientWidth+"px",this.colorPickerSelector.style.top=s-.5*this.colorPickerSelector.clientHeight+"px",this._updatePicker(t);}},{key:"_setOpacity",value:function(t){this.color.a=t/100,this._updatePicker(this.color);}},{key:"_setBrightness",value:function(t){var e=Yr(this.color.r,this.color.g,this.color.b);e.v=t/100;var i=Xr(e.h,e.s,e.v);i.a=this.color.a,this.color=i,this._updatePicker();}},{key:"_updatePicker",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.color,e=Yr(t.r,t.g,t.b),i=this.colorPickerCanvas.getContext("2d");void 0===this.pixelRation&&(this.pixelRatio=(window.devicePixelRatio||1)/(i.webkitBackingStorePixelRatio||i.mozBackingStorePixelRatio||i.msBackingStorePixelRatio||i.oBackingStorePixelRatio||i.backingStorePixelRatio||1)),i.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);var o=this.colorPickerCanvas.clientWidth,n=this.colorPickerCanvas.clientHeight;i.clearRect(0,0,o,n),i.putImageData(this.hueCircle,0,0),i.fillStyle="rgba(0,0,0,"+(1-e.v)+")",i.circle(this.centerCoordinates.x,this.centerCoordinates.y,this.r),gl(i).call(i),this.brightnessRange.value=100*e.v,this.opacityRange.value=100*t.a,this.initialColorDiv.style.backgroundColor="rgba("+this.initialColor.r+","+this.initialColor.g+","+this.initialColor.b+","+this.initialColor.a+")",this.newColorDiv.style.backgroundColor="rgba("+this.color.r+","+this.color.g+","+this.color.b+","+this.color.a+")";}},{key:"_setSize",value:function(){this.colorPickerCanvas.style.width="100%",this.colorPickerCanvas.style.height="100%",this.colorPickerCanvas.width=289*this.pixelRatio,this.colorPickerCanvas.height=289*this.pixelRatio;}},{key:"_create",value:function(){var t,e,i,o;if(this.frame=document.createElement("div"),this.frame.className="vis-color-picker",this.colorPickerDiv=document.createElement("div"),this.colorPickerSelector=document.createElement("div"),this.colorPickerSelector.className="vis-selector",this.colorPickerDiv.appendChild(this.colorPickerSelector),this.colorPickerCanvas=document.createElement("canvas"),this.colorPickerDiv.appendChild(this.colorPickerCanvas),this.colorPickerCanvas.getContext){var n=this.colorPickerCanvas.getContext("2d");this.pixelRatio=(window.devicePixelRatio||1)/(n.webkitBackingStorePixelRatio||n.mozBackingStorePixelRatio||n.msBackingStorePixelRatio||n.oBackingStorePixelRatio||n.backingStorePixelRatio||1),this.colorPickerCanvas.getContext("2d").setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);}else {var r=document.createElement("DIV");r.style.color="red",r.style.fontWeight="bold",r.style.padding="10px",r.innerHTML="Error: your browser does not support HTML canvas",this.colorPickerCanvas.appendChild(r);}this.colorPickerDiv.className="vis-color",this.opacityDiv=document.createElement("div"),this.opacityDiv.className="vis-opacity",this.brightnessDiv=document.createElement("div"),this.brightnessDiv.className="vis-brightness",this.arrowDiv=document.createElement("div"),this.arrowDiv.className="vis-arrow",this.opacityRange=document.createElement("input");try{this.opacityRange.type="range",this.opacityRange.min="0",this.opacityRange.max="100";}catch(t){}this.opacityRange.value="100",this.opacityRange.className="vis-range",this.brightnessRange=document.createElement("input");try{this.brightnessRange.type="range",this.brightnessRange.min="0",this.brightnessRange.max="100";}catch(t){}this.brightnessRange.value="100",this.brightnessRange.className="vis-range",this.opacityDiv.appendChild(this.opacityRange),this.brightnessDiv.appendChild(this.brightnessRange);var s=this;this.opacityRange.onchange=function(){s._setOpacity(this.value);},this.opacityRange.oninput=function(){s._setOpacity(this.value);},this.brightnessRange.onchange=function(){s._setBrightness(this.value);},this.brightnessRange.oninput=function(){s._setBrightness(this.value);},this.brightnessLabel=document.createElement("div"),this.brightnessLabel.className="vis-label vis-brightness",this.brightnessLabel.innerHTML="brightness:",this.opacityLabel=document.createElement("div"),this.opacityLabel.className="vis-label vis-opacity",this.opacityLabel.innerHTML="opacity:",this.newColorDiv=document.createElement("div"),this.newColorDiv.className="vis-new-color",this.newColorDiv.innerHTML="new",this.initialColorDiv=document.createElement("div"),this.initialColorDiv.className="vis-initial-color",this.initialColorDiv.innerHTML="initial",this.cancelButton=document.createElement("div"),this.cancelButton.className="vis-button vis-cancel",this.cancelButton.innerHTML="cancel",this.cancelButton.onclick=Q(t=this._hide).call(t,this,!1),this.applyButton=document.createElement("div"),this.applyButton.className="vis-button vis-apply",this.applyButton.innerHTML="apply",this.applyButton.onclick=Q(e=this._apply).call(e,this),this.saveButton=document.createElement("div"),this.saveButton.className="vis-button vis-save",this.saveButton.innerHTML="save",this.saveButton.onclick=Q(i=this._save).call(i,this),this.loadButton=document.createElement("div"),this.loadButton.className="vis-button vis-load",this.loadButton.innerHTML="load last",this.loadButton.onclick=Q(o=this._loadLast).call(o,this),this.frame.appendChild(this.colorPickerDiv),this.frame.appendChild(this.arrowDiv),this.frame.appendChild(this.brightnessLabel),this.frame.appendChild(this.brightnessDiv),this.frame.appendChild(this.opacityLabel),this.frame.appendChild(this.opacityDiv),this.frame.appendChild(this.newColorDiv),this.frame.appendChild(this.initialColorDiv),this.frame.appendChild(this.cancelButton),this.frame.appendChild(this.applyButton),this.frame.appendChild(this.saveButton),this.frame.appendChild(this.loadButton);}},{key:"_bindHammer",value:function(){var t=this;this.drag={},this.pinch={},this.hammer=new Yh(this.colorPickerCanvas),this.hammer.get("pinch").set({enable:!0}),ju(this.hammer,(function(e){t._moveSelector(e);})),this.hammer.on("tap",(function(e){t._moveSelector(e);})),this.hammer.on("panstart",(function(e){t._moveSelector(e);})),this.hammer.on("panmove",(function(e){t._moveSelector(e);})),this.hammer.on("panend",(function(e){t._moveSelector(e);}));}},{key:"_generateHueCircle",value:function(){if(!1===this.generated){var t=this.colorPickerCanvas.getContext("2d");void 0===this.pixelRation&&(this.pixelRatio=(window.devicePixelRatio||1)/(t.webkitBackingStorePixelRatio||t.mozBackingStorePixelRatio||t.msBackingStorePixelRatio||t.oBackingStorePixelRatio||t.backingStorePixelRatio||1)),t.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);var e,i,o,n,r=this.colorPickerCanvas.clientWidth,s=this.colorPickerCanvas.clientHeight;t.clearRect(0,0,r,s),this.centerCoordinates={x:.5*r,y:.5*s},this.r=.49*r;var a,h=2*Math.PI/360,d=1/this.r;for(o=0;o<360;o++)for(n=0;n<this.r;n++)e=this.centerCoordinates.x+n*Math.sin(h*o),i=this.centerCoordinates.y+n*Math.cos(h*o),a=Xr(.002777777777777778*o,n*d,1),t.fillStyle="rgb("+a.r+","+a.g+","+a.b+")",t.fillRect(e-.5,i-.5,2,2);t.strokeStyle="rgba(0,0,0,1)",t.circle(this.centerCoordinates.x,this.centerCoordinates.y,this.r),t.stroke(),this.hueCircle=t.getImageData(0,0,r,s);}this.generated=!0;}},{key:"_moveSelector",value:function(t){var e=this.colorPickerDiv.getBoundingClientRect(),i=t.center.x-e.left,o=t.center.y-e.top,n=.5*this.colorPickerDiv.clientHeight,r=.5*this.colorPickerDiv.clientWidth,s=i-r,a=o-n,h=Math.atan2(s,a),d=.98*Math.min(Math.sqrt(s*s+a*a),r),l=Math.cos(h)*d+n,c=Math.sin(h)*d+r;this.colorPickerSelector.style.top=l-.5*this.colorPickerSelector.clientHeight+"px",this.colorPickerSelector.style.left=c-.5*this.colorPickerSelector.clientWidth+"px";var u=h/(2*Math.PI);u=u<0?u+1:u;var f=d/this.r,p=Yr(this.color.r,this.color.g,this.color.b);p.h=u,p.s=f;var v=Xr(p.h,p.s,p.v);v.a=this.color.a,this.color=v,this.initialColorDiv.style.backgroundColor="rgba("+this.initialColor.r+","+this.initialColor.g+","+this.initialColor.b+","+this.initialColor.a+")",this.newColorDiv.style.backgroundColor="rgba("+this.color.r+","+this.color.g+","+this.color.b+","+this.color.a+")";}}]),t}(),sp=function(){function t(e,i,o){var n=arguments.length>3&&void 0!==arguments[3]?arguments[3]:1;Kh(this,t),this.parent=e,this.changedOptions=[],this.container=i,this.allowCreation=!1,this.options={},this.initialized=!1,this.popupCounter=0,this.defaultOptions={enabled:!1,filter:!0,container:void 0,showButton:!0},bt(this.options,this.defaultOptions),this.configureOptions=o,this.moduleOptions={},this.domElements=[],this.popupDiv={},this.popupLimit=5,this.popupHistory={},this.colorPicker=new rp(n),this.wrapper=void 0;}return Zh(t,[{key:"setOptions",value:function(t){if(void 0!==t){this.popupHistory={},this._removePopup();var e=!0;if("string"==typeof t)this.options.filter=t;else if(dr(t))this.options.filter=t.join();else if("object"===cr(t)){if(null==t)throw new TypeError("options cannot be null");void 0!==t.container&&(this.options.container=t.container),void 0!==pn(t)&&(this.options.filter=pn(t)),void 0!==t.showButton&&(this.options.showButton=t.showButton),void 0!==t.enabled&&(e=t.enabled);}else "boolean"==typeof t?(this.options.filter=!0,e=t):"function"==typeof t&&(this.options.filter=t,e=!0);!1===pn(this.options)&&(e=!1),this.options.enabled=e;}this._clean();}},{key:"setModuleOptions",value:function(t){this.moduleOptions=t,!0===this.options.enabled&&(this._clean(),void 0!==this.options.container&&(this.container=this.options.container),this._create());}},{key:"_create",value:function(){this._clean(),this.changedOptions=[];var t=pn(this.options),e=0,i=!1;for(var o in this.configureOptions)Object.prototype.hasOwnProperty.call(this.configureOptions,o)&&(this.allowCreation=!1,i=!1,"function"==typeof t?i=(i=t(o,[]))||this._handleObject(this.configureOptions[o],[o],!0):!0!==t&&-1===On(t).call(t,o)||(i=!0),!1!==i&&(this.allowCreation=!0,e>0&&this._makeItem([]),this._makeHeader(o),this._handleObject(this.configureOptions[o],[o])),e++);this._makeButton(),this._push();}},{key:"_push",value:function(){this.wrapper=document.createElement("div"),this.wrapper.className="vis-configuration-wrapper",this.container.appendChild(this.wrapper);for(var t=0;t<this.domElements.length;t++)this.wrapper.appendChild(this.domElements[t]);this._showPopupIfNeeded();}},{key:"_clean",value:function(){for(var t=0;t<this.domElements.length;t++)this.wrapper.removeChild(this.domElements[t]);void 0!==this.wrapper&&(this.container.removeChild(this.wrapper),this.wrapper=void 0),this.domElements=[],this._removePopup();}},{key:"_getValue",value:function(t){for(var e=this.moduleOptions,i=0;i<t.length;i++){if(void 0===e[t[i]]){e=void 0;break}e=e[t[i]];}return e}},{key:"_makeItem",value:function(t){if(!0===this.allowCreation){var e=document.createElement("div");e.className="vis-configuration vis-config-item vis-config-s"+t.length;for(var i=arguments.length,o=new Array(i>1?i-1:0),n=1;n<i;n++)o[n-1]=arguments[n];return qo(o).call(o,(function(t){e.appendChild(t);})),this.domElements.push(e),this.domElements.length}return 0}},{key:"_makeHeader",value:function(t){var e=document.createElement("div");e.className="vis-configuration vis-config-header",e.innerHTML=t,this._makeItem([],e);}},{key:"_makeLabel",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=document.createElement("div");return o.className="vis-configuration vis-config-label vis-config-s"+e.length,o.innerHTML=!0===i?"<i><b>"+t+":</b></i>":t+":",o}},{key:"_makeDropdown",value:function(t,e,i){var o=document.createElement("select");o.className="vis-configuration vis-config-select";var n=0;void 0!==e&&-1!==On(t).call(t,e)&&(n=On(t).call(t,e));for(var r=0;r<t.length;r++){var s=document.createElement("option");s.value=t[r],r===n&&(s.selected="selected"),s.innerHTML=t[r],o.appendChild(s);}var a=this;o.onchange=function(){a._update(this.value,i);};var h=this._makeLabel(i[i.length-1],i);this._makeItem(i,h,o);}},{key:"_makeRange",value:function(t,e,i){var o=t[0],n=t[1],r=t[2],s=t[3],a=document.createElement("input");a.className="vis-configuration vis-config-range";try{a.type="range",a.min=n,a.max=r;}catch(t){}a.step=s;var h="",d=0;if(void 0!==e){var l=1.2;e<0&&e*l<n?(a.min=Math.ceil(e*l),d=a.min,h="range increased"):e/l<n&&(a.min=Math.ceil(e/l),d=a.min,h="range increased"),e*l>r&&1!==r&&(a.max=Math.ceil(e*l),d=a.max,h="range increased"),a.value=e;}else a.value=o;var c=document.createElement("input");c.className="vis-configuration vis-config-rangeinput",c.value=a.value;var u=this;a.onchange=function(){c.value=this.value,u._update(Number(this.value),i);},a.oninput=function(){c.value=this.value;};var f=this._makeLabel(i[i.length-1],i),p=this._makeItem(i,f,a,c);""!==h&&this.popupHistory[p]!==d&&(this.popupHistory[p]=d,this._setupPopup(h,p));}},{key:"_makeButton",value:function(){var t=this;if(!0===this.options.showButton){var e=document.createElement("div");e.className="vis-configuration vis-config-button",e.innerHTML="generate options",e.onclick=function(){t._printOptions();},e.onmouseover=function(){e.className="vis-configuration vis-config-button hover";},e.onmouseout=function(){e.className="vis-configuration vis-config-button";},this.optionsContainer=document.createElement("div"),this.optionsContainer.className="vis-configuration vis-config-option-container",this.domElements.push(this.optionsContainer),this.domElements.push(e);}}},{key:"_setupPopup",value:function(t,e){var i=this;if(!0===this.initialized&&!0===this.allowCreation&&this.popupCounter<this.popupLimit){var o=document.createElement("div");o.id="vis-configuration-popup",o.className="vis-configuration-popup",o.innerHTML=t,o.onclick=function(){i._removePopup();},this.popupCounter+=1,this.popupDiv={html:o,index:e};}}},{key:"_removePopup",value:function(){void 0!==this.popupDiv.html&&(this.popupDiv.html.parentNode.removeChild(this.popupDiv.html),clearTimeout(this.popupDiv.hideTimeout),clearTimeout(this.popupDiv.deleteTimeout),this.popupDiv={});}},{key:"_showPopupIfNeeded",value:function(){var t=this;if(void 0!==this.popupDiv.html){var e=this.domElements[this.popupDiv.index].getBoundingClientRect();this.popupDiv.html.style.left=e.left+"px",this.popupDiv.html.style.top=e.top-30+"px",document.body.appendChild(this.popupDiv.html),this.popupDiv.hideTimeout=_d((function(){t.popupDiv.html.style.opacity=0;}),1500),this.popupDiv.deleteTimeout=_d((function(){t._removePopup();}),1800);}}},{key:"_makeCheckbox",value:function(t,e,i){var o=document.createElement("input");o.type="checkbox",o.className="vis-configuration vis-config-checkbox",o.checked=t,void 0!==e&&(o.checked=e,e!==t&&("object"===cr(t)?e!==t.enabled&&this.changedOptions.push({path:i,value:e}):this.changedOptions.push({path:i,value:e})));var n=this;o.onchange=function(){n._update(this.checked,i);};var r=this._makeLabel(i[i.length-1],i);this._makeItem(i,r,o);}},{key:"_makeTextInput",value:function(t,e,i){var o=document.createElement("input");o.type="text",o.className="vis-configuration vis-config-text",o.value=e,e!==t&&this.changedOptions.push({path:i,value:e});var n=this;o.onchange=function(){n._update(this.value,i);};var r=this._makeLabel(i[i.length-1],i);this._makeItem(i,r,o);}},{key:"_makeColorField",value:function(t,e,i){var o=this,n=t[1],r=document.createElement("div");"none"!==(e=void 0===e?n:e)?(r.className="vis-configuration vis-config-colorBlock",r.style.backgroundColor=e):r.className="vis-configuration vis-config-colorBlock none",e=void 0===e?n:e,r.onclick=function(){o._showColorPicker(e,r,i);};var s=this._makeLabel(i[i.length-1],i);this._makeItem(i,s,r);}},{key:"_showColorPicker",value:function(t,e,i){var o=this;e.onclick=function(){},this.colorPicker.insertTo(e),this.colorPicker.show(),this.colorPicker.setColor(t),this.colorPicker.setUpdateCallback((function(t){var n="rgba("+t.r+","+t.g+","+t.b+","+t.a+")";e.style.backgroundColor=n,o._update(n,i);})),this.colorPicker.setCloseCallback((function(){e.onclick=function(){o._showColorPicker(t,e,i);};}));}},{key:"_handleObject",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=!1,n=pn(this.options),r=!1;for(var s in t)if(Object.prototype.hasOwnProperty.call(t,s)){o=!0;var a=t[s],h=Rr(e,s);if("function"==typeof n&&!1===(o=n(s,e))&&!dr(a)&&"string"!=typeof a&&"boolean"!=typeof a&&a instanceof Object&&(this.allowCreation=!1,o=this._handleObject(a,h,!0),this.allowCreation=!1===i),!1!==o){r=!0;var d=this._getValue(h);if(dr(a))this._handleArray(a,d,h);else if("string"==typeof a)this._makeTextInput(a,d,h);else if("boolean"==typeof a)this._makeCheckbox(a,d,h);else if(a instanceof Object){var l=!0;if(-1!==On(e).call(e,"physics")&&this.moduleOptions.physics.solver!==s&&"wind"!==s&&(l=!1),!0===l)if(void 0!==a.enabled){var c=Rr(h,"enabled"),u=this._getValue(c);if(!0===u){var f=this._makeLabel(s,h,!0);this._makeItem(h,f),r=this._handleObject(a,h)||r;}else this._makeCheckbox(a,u,h);}else {var p=this._makeLabel(s,h,!0);this._makeItem(h,p),r=this._handleObject(a,h)||r;}}else console.error("dont know how to handle",a,s,h);}}return r}},{key:"_handleArray",value:function(t,e,i){"string"==typeof t[0]&&"color"===t[0]?(this._makeColorField(t,e,i),t[1]!==e&&this.changedOptions.push({path:i,value:e})):"string"==typeof t[0]?(this._makeDropdown(t,e,i),t[0]!==e&&this.changedOptions.push({path:i,value:e})):"number"==typeof t[0]&&(this._makeRange(t,e,i),t[0]!==e&&this.changedOptions.push({path:i,value:Number(e)}));}},{key:"_update",value:function(t,e){var i=this._constructOptions(t,e);this.parent.body&&this.parent.body.emitter&&this.parent.body.emitter.emit&&this.parent.body.emitter.emit("configChange",i),this.initialized=!0,this.parent.setOptions(i);}},{key:"_constructOptions",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},o=i;t="false"!==(t="true"===t||t)&&t;for(var n=0;n<e.length;n++)"global"!==e[n]&&(void 0===o[e[n]]&&(o[e[n]]={}),n!==e.length-1?o=o[e[n]]:o[e[n]]=t);return i}},{key:"_printOptions",value:function(){var t=this.getOptions();this.optionsContainer.innerHTML="<pre>var options = "+dc(t,null,2)+"</pre>";}},{key:"getOptions",value:function(){for(var t={},e=0;e<this.changedOptions.length;e++)this._constructOptions(this.changedOptions[e].value,this.changedOptions[e].path,t);return t}}]),t}(),ap="string",hp="boolean",dp="number",lp="array",cp="object",up=["arrow","bar","box","circle","crow","curve","diamond","image","inv_curve","inv_triangle","triangle","vee"],fp={configure:{enabled:{boolean:hp},filter:{boolean:hp,string:ap,array:lp,function:"function"},container:{dom:"dom"},showButton:{boolean:hp},__type__:{object:cp,boolean:hp,string:ap,array:lp,function:"function"}},edges:{arrows:{to:{enabled:{boolean:hp},scaleFactor:{number:dp},type:{string:up},imageHeight:{number:dp},imageWidth:{number:dp},src:{string:ap},__type__:{object:cp,boolean:hp}},middle:{enabled:{boolean:hp},scaleFactor:{number:dp},type:{string:up},imageWidth:{number:dp},imageHeight:{number:dp},src:{string:ap},__type__:{object:cp,boolean:hp}},from:{enabled:{boolean:hp},scaleFactor:{number:dp},type:{string:up},imageWidth:{number:dp},imageHeight:{number:dp},src:{string:ap},__type__:{object:cp,boolean:hp}},__type__:{string:["from","to","middle"],object:cp}},endPointOffset:{from:{number:dp},to:{number:dp},__type__:{object:cp,number:dp}},arrowStrikethrough:{boolean:hp},background:{enabled:{boolean:hp},color:{string:ap},size:{number:dp},dashes:{boolean:hp,array:lp},__type__:{object:cp,boolean:hp}},chosen:{label:{boolean:hp,function:"function"},edge:{boolean:hp,function:"function"},__type__:{object:cp,boolean:hp}},color:{color:{string:ap},highlight:{string:ap},hover:{string:ap},inherit:{string:["from","to","both"],boolean:hp},opacity:{number:dp},__type__:{object:cp,string:ap}},dashes:{boolean:hp,array:lp},font:{color:{string:ap},size:{number:dp},face:{string:ap},background:{string:ap},strokeWidth:{number:dp},strokeColor:{string:ap},align:{string:["horizontal","top","middle","bottom"]},vadjust:{number:dp},multi:{boolean:hp,string:ap},bold:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},boldital:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},ital:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},mono:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},__type__:{object:cp,string:ap}},hidden:{boolean:hp},hoverWidth:{function:"function",number:dp},label:{string:ap,undefined:"undefined"},labelHighlightBold:{boolean:hp},length:{number:dp,undefined:"undefined"},physics:{boolean:hp},scaling:{min:{number:dp},max:{number:dp},label:{enabled:{boolean:hp},min:{number:dp},max:{number:dp},maxVisible:{number:dp},drawThreshold:{number:dp},__type__:{object:cp,boolean:hp}},customScalingFunction:{function:"function"},__type__:{object:cp}},selectionWidth:{function:"function",number:dp},selfReferenceSize:{number:dp},selfReference:{size:{number:dp},angle:{number:dp},renderBehindTheNode:{boolean:hp},__type__:{object:cp}},shadow:{enabled:{boolean:hp},color:{string:ap},size:{number:dp},x:{number:dp},y:{number:dp},__type__:{object:cp,boolean:hp}},smooth:{enabled:{boolean:hp},type:{string:["dynamic","continuous","discrete","diagonalCross","straightCross","horizontal","vertical","curvedCW","curvedCCW","cubicBezier"]},roundness:{number:dp},forceDirection:{string:["horizontal","vertical","none"],boolean:hp},__type__:{object:cp,boolean:hp}},title:{string:ap,undefined:"undefined"},width:{number:dp},widthConstraint:{maximum:{number:dp},__type__:{object:cp,boolean:hp,number:dp}},value:{number:dp,undefined:"undefined"},__type__:{object:cp}},groups:{useDefaultGroups:{boolean:hp},__any__:"get from nodes, will be overwritten below",__type__:{object:cp}},interaction:{dragNodes:{boolean:hp},dragView:{boolean:hp},hideEdgesOnDrag:{boolean:hp},hideEdgesOnZoom:{boolean:hp},hideNodesOnDrag:{boolean:hp},hover:{boolean:hp},keyboard:{enabled:{boolean:hp},speed:{x:{number:dp},y:{number:dp},zoom:{number:dp},__type__:{object:cp}},bindToWindow:{boolean:hp},__type__:{object:cp,boolean:hp}},multiselect:{boolean:hp},navigationButtons:{boolean:hp},selectable:{boolean:hp},selectConnectedEdges:{boolean:hp},hoverConnectedEdges:{boolean:hp},tooltipDelay:{number:dp},zoomView:{boolean:hp},zoomSpeed:{number:dp},__type__:{object:cp}},layout:{randomSeed:{undefined:"undefined",number:dp,string:ap},improvedLayout:{boolean:hp},clusterThreshold:{number:dp},hierarchical:{enabled:{boolean:hp},levelSeparation:{number:dp},nodeSpacing:{number:dp},treeSpacing:{number:dp},blockShifting:{boolean:hp},edgeMinimization:{boolean:hp},parentCentralization:{boolean:hp},direction:{string:["UD","DU","LR","RL"]},sortMethod:{string:["hubsize","directed"]},shakeTowards:{string:["leaves","roots"]},__type__:{object:cp,boolean:hp}},__type__:{object:cp}},manipulation:{enabled:{boolean:hp},initiallyActive:{boolean:hp},addNode:{boolean:hp,function:"function"},addEdge:{boolean:hp,function:"function"},editNode:{function:"function"},editEdge:{editWithoutDrag:{function:"function"},__type__:{object:cp,boolean:hp,function:"function"}},deleteNode:{boolean:hp,function:"function"},deleteEdge:{boolean:hp,function:"function"},controlNodeStyle:"get from nodes, will be overwritten below",__type__:{object:cp,boolean:hp}},nodes:{borderWidth:{number:dp},borderWidthSelected:{number:dp,undefined:"undefined"},brokenImage:{string:ap,undefined:"undefined"},chosen:{label:{boolean:hp,function:"function"},node:{boolean:hp,function:"function"},__type__:{object:cp,boolean:hp}},color:{border:{string:ap},background:{string:ap},highlight:{border:{string:ap},background:{string:ap},__type__:{object:cp,string:ap}},hover:{border:{string:ap},background:{string:ap},__type__:{object:cp,string:ap}},__type__:{object:cp,string:ap}},opacity:{number:dp,undefined:"undefined"},fixed:{x:{boolean:hp},y:{boolean:hp},__type__:{object:cp,boolean:hp}},font:{align:{string:ap},color:{string:ap},size:{number:dp},face:{string:ap},background:{string:ap},strokeWidth:{number:dp},strokeColor:{string:ap},vadjust:{number:dp},multi:{boolean:hp,string:ap},bold:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},boldital:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},ital:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},mono:{color:{string:ap},size:{number:dp},face:{string:ap},mod:{string:ap},vadjust:{number:dp},__type__:{object:cp,string:ap}},__type__:{object:cp,string:ap}},group:{string:ap,number:dp,undefined:"undefined"},heightConstraint:{minimum:{number:dp},valign:{string:ap},__type__:{object:cp,boolean:hp,number:dp}},hidden:{boolean:hp},icon:{face:{string:ap},code:{string:ap},size:{number:dp},color:{string:ap},weight:{string:ap,number:dp},__type__:{object:cp}},id:{string:ap,number:dp},image:{selected:{string:ap,undefined:"undefined"},unselected:{string:ap,undefined:"undefined"},__type__:{object:cp,string:ap}},imagePadding:{top:{number:dp},right:{number:dp},bottom:{number:dp},left:{number:dp},__type__:{object:cp,number:dp}},label:{string:ap,undefined:"undefined"},labelHighlightBold:{boolean:hp},level:{number:dp,undefined:"undefined"},margin:{top:{number:dp},right:{number:dp},bottom:{number:dp},left:{number:dp},__type__:{object:cp,number:dp}},mass:{number:dp},physics:{boolean:hp},scaling:{min:{number:dp},max:{number:dp},label:{enabled:{boolean:hp},min:{number:dp},max:{number:dp},maxVisible:{number:dp},drawThreshold:{number:dp},__type__:{object:cp,boolean:hp}},customScalingFunction:{function:"function"},__type__:{object:cp}},shadow:{enabled:{boolean:hp},color:{string:ap},size:{number:dp},x:{number:dp},y:{number:dp},__type__:{object:cp,boolean:hp}},shape:{string:["custom","ellipse","circle","database","box","text","image","circularImage","diamond","dot","star","triangle","triangleDown","square","icon","hexagon"]},ctxRenderer:{function:"function"},shapeProperties:{borderDashes:{boolean:hp,array:lp},borderRadius:{number:dp},interpolation:{boolean:hp},useImageSize:{boolean:hp},useBorderWithImage:{boolean:hp},coordinateOrigin:{string:["center","top-left"]},__type__:{object:cp}},size:{number:dp},title:{string:ap,dom:"dom",undefined:"undefined"},value:{number:dp,undefined:"undefined"},widthConstraint:{minimum:{number:dp},maximum:{number:dp},__type__:{object:cp,boolean:hp,number:dp}},x:{number:dp},y:{number:dp},__type__:{object:cp}},physics:{enabled:{boolean:hp},barnesHut:{theta:{number:dp},gravitationalConstant:{number:dp},centralGravity:{number:dp},springLength:{number:dp},springConstant:{number:dp},damping:{number:dp},avoidOverlap:{number:dp},__type__:{object:cp}},forceAtlas2Based:{theta:{number:dp},gravitationalConstant:{number:dp},centralGravity:{number:dp},springLength:{number:dp},springConstant:{number:dp},damping:{number:dp},avoidOverlap:{number:dp},__type__:{object:cp}},repulsion:{centralGravity:{number:dp},springLength:{number:dp},springConstant:{number:dp},nodeDistance:{number:dp},damping:{number:dp},__type__:{object:cp}},hierarchicalRepulsion:{centralGravity:{number:dp},springLength:{number:dp},springConstant:{number:dp},nodeDistance:{number:dp},damping:{number:dp},avoidOverlap:{number:dp},__type__:{object:cp}},maxVelocity:{number:dp},minVelocity:{number:dp},solver:{string:["barnesHut","repulsion","hierarchicalRepulsion","forceAtlas2Based"]},stabilization:{enabled:{boolean:hp},iterations:{number:dp},updateInterval:{number:dp},onlyDynamicEdges:{boolean:hp},fit:{boolean:hp},__type__:{object:cp,boolean:hp}},timestep:{number:dp},adaptiveTimestep:{boolean:hp},wind:{x:{number:dp},y:{number:dp},__type__:{object:cp}},__type__:{object:cp,boolean:hp}},autoResize:{boolean:hp},clickToUse:{boolean:hp},locale:{string:ap},locales:{__any__:{any:"any"},__type__:{object:cp}},height:{string:ap},width:{string:ap},__type__:{object:cp}};fp.groups.__any__=fp.nodes,fp.manipulation.controlNodeStyle=fp.nodes;var pp={nodes:{borderWidth:[1,0,10,1],borderWidthSelected:[2,0,10,1],color:{border:["color","#2B7CE9"],background:["color","#97C2FC"],highlight:{border:["color","#2B7CE9"],background:["color","#D2E5FF"]},hover:{border:["color","#2B7CE9"],background:["color","#D2E5FF"]}},opacity:[0,0,1,.1],fixed:{x:!1,y:!1},font:{color:["color","#343434"],size:[14,0,100,1],face:["arial","verdana","tahoma"],background:["color","none"],strokeWidth:[0,0,50,1],strokeColor:["color","#ffffff"]},hidden:!1,labelHighlightBold:!0,physics:!0,scaling:{min:[10,0,200,1],max:[30,0,200,1],label:{enabled:!1,min:[14,0,200,1],max:[30,0,200,1],maxVisible:[30,0,200,1],drawThreshold:[5,0,20,1]}},shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:[10,0,20,1],x:[5,-30,30,1],y:[5,-30,30,1]},shape:["ellipse","box","circle","database","diamond","dot","square","star","text","triangle","triangleDown","hexagon"],shapeProperties:{borderDashes:!1,borderRadius:[6,0,20,1],interpolation:!0,useImageSize:!1},size:[25,0,200,1]},edges:{arrows:{to:{enabled:!1,scaleFactor:[1,0,3,.05],type:"arrow"},middle:{enabled:!1,scaleFactor:[1,0,3,.05],type:"arrow"},from:{enabled:!1,scaleFactor:[1,0,3,.05],type:"arrow"}},endPointOffset:{from:[0,-10,10,1],to:[0,-10,10,1]},arrowStrikethrough:!0,color:{color:["color","#848484"],highlight:["color","#848484"],hover:["color","#848484"],inherit:["from","to","both",!0,!1],opacity:[1,0,1,.05]},dashes:!1,font:{color:["color","#343434"],size:[14,0,100,1],face:["arial","verdana","tahoma"],background:["color","none"],strokeWidth:[2,0,50,1],strokeColor:["color","#ffffff"],align:["horizontal","top","middle","bottom"]},hidden:!1,hoverWidth:[1.5,0,5,.1],labelHighlightBold:!0,physics:!0,scaling:{min:[1,0,100,1],max:[15,0,100,1],label:{enabled:!0,min:[14,0,200,1],max:[30,0,200,1],maxVisible:[30,0,200,1],drawThreshold:[5,0,20,1]}},selectionWidth:[1.5,0,5,.1],selfReferenceSize:[20,0,200,1],selfReference:{size:[20,0,200,1],angle:[Math.PI/2,-6*Math.PI,6*Math.PI,Math.PI/8],renderBehindTheNode:!0},shadow:{enabled:!1,color:"rgba(0,0,0,0.5)",size:[10,0,20,1],x:[5,-30,30,1],y:[5,-30,30,1]},smooth:{enabled:!0,type:["dynamic","continuous","discrete","diagonalCross","straightCross","horizontal","vertical","curvedCW","curvedCCW","cubicBezier"],forceDirection:["horizontal","vertical","none"],roundness:[.5,0,1,.05]},width:[1,0,30,1]},layout:{hierarchical:{enabled:!1,levelSeparation:[150,20,500,5],nodeSpacing:[100,20,500,5],treeSpacing:[200,20,500,5],blockShifting:!0,edgeMinimization:!0,parentCentralization:!0,direction:["UD","DU","LR","RL"],sortMethod:["hubsize","directed"],shakeTowards:["leaves","roots"]}},interaction:{dragNodes:!0,dragView:!0,hideEdgesOnDrag:!1,hideEdgesOnZoom:!1,hideNodesOnDrag:!1,hover:!1,keyboard:{enabled:!1,speed:{x:[10,0,40,1],y:[10,0,40,1],zoom:[.02,0,.1,.005]},bindToWindow:!0},multiselect:!1,navigationButtons:!1,selectable:!0,selectConnectedEdges:!0,hoverConnectedEdges:!0,tooltipDelay:[300,0,1e3,25],zoomView:!0,zoomSpeed:[1,.1,2,.1]},manipulation:{enabled:!1,initiallyActive:!1},physics:{enabled:!0,barnesHut:{theta:[.5,.1,1,.05],gravitationalConstant:[-2e3,-3e4,0,50],centralGravity:[.3,0,10,.05],springLength:[95,0,500,5],springConstant:[.04,0,1.2,.005],damping:[.09,0,1,.01],avoidOverlap:[0,0,1,.01]},forceAtlas2Based:{theta:[.5,.1,1,.05],gravitationalConstant:[-50,-500,0,1],centralGravity:[.01,0,1,.005],springLength:[95,0,500,5],springConstant:[.08,0,1.2,.005],damping:[.4,0,1,.01],avoidOverlap:[0,0,1,.01]},repulsion:{centralGravity:[.2,0,10,.05],springLength:[200,0,500,5],springConstant:[.05,0,1.2,.005],nodeDistance:[100,0,500,5],damping:[.09,0,1,.01]},hierarchicalRepulsion:{centralGravity:[.2,0,10,.05],springLength:[100,0,500,5],springConstant:[.01,0,1.2,.005],nodeDistance:[120,0,500,5],damping:[.09,0,1,.01],avoidOverlap:[0,0,1,.01]},maxVelocity:[50,0,150,1],minVelocity:[.1,.01,.5,.01],solver:["barnesHut","forceAtlas2Based","repulsion","hierarchicalRepulsion"],timestep:[.5,.01,1,.01],wind:{x:[0,-10,10,.1],y:[0,-10,10,.1]}}},vp=Object.freeze({__proto__:null,allOptions:fp,configureOptions:pp}),gp=function(){function t(){Kh(this,t);}return Zh(t,[{key:"getDistances",value:function(t,e,i){for(var o={},n=t.edges,r=0;r<e.length;r++){var s={};o[e[r]]=s;for(var a=0;a<e.length;a++)s[e[a]]=r==a?0:1e9;}for(var h=0;h<i.length;h++){var d=n[i[h]];!0===d.connected&&void 0!==o[d.fromId]&&void 0!==o[d.toId]&&(o[d.fromId][d.toId]=1,o[d.toId][d.fromId]=1);}for(var l=e.length,c=0;c<l;c++)for(var u=e[c],f=o[u],p=0;p<l-1;p++)for(var v=e[p],g=o[v],y=p+1;y<l;y++){var m=e[y],b=o[m],w=Math.min(g[m],g[u]+f[m]);g[m]=w,b[v]=w;}return o}}]),t}(),yp=function(){function t(e,i,o){Kh(this,t),this.body=e,this.springLength=i,this.springConstant=o,this.distanceSolver=new gp;}return Zh(t,[{key:"setOptions",value:function(t){t&&(t.springLength&&(this.springLength=t.springLength),t.springConstant&&(this.springConstant=t.springConstant));}},{key:"solve",value:function(t,e){var i=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=this.distanceSolver.getDistances(this.body,t,e);this._createL_matrix(o),this._createK_matrix(o),this._createE_matrix();for(var n=.01,r=1,s=0,a=Math.max(1e3,Math.min(10*this.body.nodeIndices.length,6e3)),h=5,d=1e9,l=0,c=0,u=0,f=0,p=0;d>n&&s<a;){s+=1;var v=this._getHighestEnergyNode(i),g=Jn(v,4);for(l=g[0],d=g[1],c=g[2],u=g[3],f=d,p=0;f>r&&p<h;){p+=1,this._moveNode(l,c,u);var y=this._getEnergy(l),m=Jn(y,3);f=m[0],c=m[1],u=m[2];}}}},{key:"_getHighestEnergyNode",value:function(t){for(var e=this.body.nodeIndices,i=this.body.nodes,o=0,n=e[0],r=0,s=0,a=0;a<e.length;a++){var h=e[a];if(!0!==i[h].predefinedPosition||!0===i[h].isCluster&&!0===t||!0!==i[h].options.fixed.x||!0!==i[h].options.fixed.y){var d=this._getEnergy(h),l=Jn(d,3),c=l[0],u=l[1],f=l[2];o<c&&(o=c,n=h,r=u,s=f);}}return [n,o,r,s]}},{key:"_getEnergy",value:function(t){var e=Jn(this.E_sums[t],2),i=e[0],o=e[1];return [Math.sqrt(Math.pow(i,2)+Math.pow(o,2)),i,o]}},{key:"_moveNode",value:function(t,e,i){for(var o=this.body.nodeIndices,n=this.body.nodes,r=0,s=0,a=0,h=n[t].x,d=n[t].y,l=this.K_matrix[t],c=this.L_matrix[t],u=0;u<o.length;u++){var f=o[u];if(f!==t){var p=n[f].x,v=n[f].y,g=l[f],y=c[f],m=1/Math.pow(Math.pow(h-p,2)+Math.pow(d-v,2),1.5);r+=g*(1-y*Math.pow(d-v,2)*m),s+=g*(y*(h-p)*(d-v)*m),a+=g*(1-y*Math.pow(h-p,2)*m);}}var b=(e/r+i/s)/(s/r-a/s),w=-(s*b+e)/r;n[t].x+=w,n[t].y+=b,this._updateE_matrix(t);}},{key:"_createL_matrix",value:function(t){var e=this.body.nodeIndices,i=this.springLength;this.L_matrix=[];for(var o=0;o<e.length;o++){this.L_matrix[e[o]]={};for(var n=0;n<e.length;n++)this.L_matrix[e[o]][e[n]]=i*t[e[o]][e[n]];}}},{key:"_createK_matrix",value:function(t){var e=this.body.nodeIndices,i=this.springConstant;this.K_matrix=[];for(var o=0;o<e.length;o++){this.K_matrix[e[o]]={};for(var n=0;n<e.length;n++)this.K_matrix[e[o]][e[n]]=i*Math.pow(t[e[o]][e[n]],-2);}}},{key:"_createE_matrix",value:function(){var t=this.body.nodeIndices,e=this.body.nodes;this.E_matrix={},this.E_sums={};for(var i=0;i<t.length;i++)this.E_matrix[t[i]]=[];for(var o=0;o<t.length;o++){for(var n=t[o],r=e[n].x,s=e[n].y,a=0,h=0,d=o;d<t.length;d++){var l=t[d];if(l!==n){var c=e[l].x,u=e[l].y,f=1/Math.sqrt(Math.pow(r-c,2)+Math.pow(s-u,2));this.E_matrix[n][d]=[this.K_matrix[n][l]*(r-c-this.L_matrix[n][l]*(r-c)*f),this.K_matrix[n][l]*(s-u-this.L_matrix[n][l]*(s-u)*f)],this.E_matrix[l][o]=this.E_matrix[n][d],a+=this.E_matrix[n][d][0],h+=this.E_matrix[n][d][1];}}this.E_sums[n]=[a,h];}}},{key:"_updateE_matrix",value:function(t){for(var e=this.body.nodeIndices,i=this.body.nodes,o=this.E_matrix[t],n=this.K_matrix[t],r=this.L_matrix[t],s=i[t].x,a=i[t].y,h=0,d=0,l=0;l<e.length;l++){var c=e[l];if(c!==t){var u=o[l],f=u[0],p=u[1],v=i[c].x,g=i[c].y,y=1/Math.sqrt(Math.pow(s-v,2)+Math.pow(a-g,2)),m=n[c]*(s-v-r[c]*(s-v)*y),b=n[c]*(a-g-r[c]*(a-g)*y);o[l]=[m,b],h+=m,d+=b;var w=this.E_sums[c];w[0]+=m-f,w[1]+=b-p;}}this.E_sums[t]=[h,d];}}]),t}();function mp(t,e,i){var o,n,r,s,a=this;if(!(this instanceof mp))throw new SyntaxError("Constructor must be called with the new operator");this.options={},this.defaultOptions={locale:"en",locales:Gh,clickToUse:!1},bt(this.options,this.defaultOptions),this.body={container:t,nodes:{},nodeIndices:[],edges:{},edgeIndices:[],emitter:{on:Q(o=this.on).call(o,this),off:Q(n=this.off).call(n,this),emit:Q(r=this.emit).call(r,this),once:Q(s=this.once).call(s,this)},eventListeners:{onTap:function(){},onTouch:function(){},onDoubleTap:function(){},onHold:function(){},onDragStart:function(){},onDrag:function(){},onDragEnd:function(){},onMouseWheel:function(){},onPinch:function(){},onMouseMove:function(){},onRelease:function(){},onContext:function(){}},data:{nodes:null,edges:null},functions:{createNode:function(){},createEdge:function(){},getPointer:function(){}},modules:{},view:{scale:1,translation:{x:0,y:0}},selectionBox:{show:!1,position:{start:{x:0,y:0},end:{x:0,y:0}}}},this.bindEventListeners(),this.images=new Jh((function(){return a.body.emitter.emit("_requestRedraw")})),this.groups=new md,this.canvas=new Hu(this.body),this.selectionHandler=new _f(this.body,this.canvas),this.interactionHandler=new Gu(this.body,this.canvas,this.selectionHandler),this.view=new Vu(this.body,this.canvas),this.renderer=new Au(this.body,this.canvas),this.physics=new yu(this.body),this.layoutEngine=new ip(this.body),this.clustering=new Bu(this.body),this.manipulation=new op(this.body,this.canvas,this.selectionHandler,this.interactionHandler),this.nodesHandler=new mc(this.body,this.images,this.groups,this.layoutEngine),this.edgesHandler=new su(this.body,this.images,this.groups),this.body.modules.kamadaKawai=new yp(this.body,150,.05),this.body.modules.clustering=this.clustering,this.canvas._create(),this.setOptions(i),this.setData(e);}Ct(mp.prototype),mp.prototype.setOptions=function(t){var e=this;if(null===t&&(t=void 0),void 0!==t){!0===uc.validate(t,fp)&&console.error("%cErrors have been found in the supplied options object.",cc);if(Fr(["locale","locales","clickToUse"],this.options,t),void 0!==t.locale&&(t.locale=function(t,e){try{var i=e.split(/[-_ /]/,2),o=Jn(i,2),n=o[0],r=o[1],s=null!=n?n.toLowerCase():null,a=null!=r?r.toUpperCase():null;if(s&&a){var h,d=s+"-"+a;if(Object.prototype.hasOwnProperty.call(t,d))return d;console.warn(br(h="Unknown variant ".concat(a," of language ")).call(h,s,"."));}if(s){var l=s;if(Object.prototype.hasOwnProperty.call(t,l))return l;console.warn("Unknown language ".concat(s));}return console.warn("Unknown locale ".concat(e,", falling back to English.")),"en"}catch(t){return console.error(t),console.warn("Unexpected error while normalizing locale ".concat(e,", falling back to English.")),"en"}}(t.locales||this.options.locales,t.locale)),t=this.layoutEngine.setOptions(t.layout,t),this.canvas.setOptions(t),this.groups.setOptions(t.groups),this.nodesHandler.setOptions(t.nodes),this.edgesHandler.setOptions(t.edges),this.physics.setOptions(t.physics),this.manipulation.setOptions(t.manipulation,t,this.options),this.interactionHandler.setOptions(t.interaction),this.renderer.setOptions(t.interaction),this.selectionHandler.setOptions(t.interaction),void 0!==t.groups&&this.body.emitter.emit("refreshNodes"),"configure"in t&&(this.configurator||(this.configurator=new sp(this,this.body.container,pp,this.canvas.pixelRatio)),this.configurator.setOptions(t.configure)),this.configurator&&!0===this.configurator.options.enabled){var i={nodes:{},edges:{},layout:{},interaction:{},manipulation:{},physics:{},global:{}};Ar(i.nodes,this.nodesHandler.options),Ar(i.edges,this.edgesHandler.options),Ar(i.layout,this.layoutEngine.options),Ar(i.interaction,this.selectionHandler.options),Ar(i.interaction,this.renderer.options),Ar(i.interaction,this.interactionHandler.options),Ar(i.manipulation,this.manipulation.options),Ar(i.physics,this.physics.options),Ar(i.global,this.canvas.options),Ar(i.global,this.options),this.configurator.setModuleOptions(i);}void 0!==t.clickToUse?!0===t.clickToUse?void 0===this.activator&&(this.activator=new Xh(this.canvas.frame),this.activator.on("change",(function(){e.body.emitter.emit("activate");}))):(void 0!==this.activator&&(this.activator.destroy(),delete this.activator),this.body.emitter.emit("activate")):this.body.emitter.emit("activate"),this.canvas.setSize(),this.body.emitter.emit("startSimulation");}},mp.prototype._updateVisibleIndices=function(){var t=this.body.nodes,e=this.body.edges;for(var i in this.body.nodeIndices=[],this.body.edgeIndices=[],t)Object.prototype.hasOwnProperty.call(t,i)&&(this.clustering._isClusteredNode(i)||!1!==t[i].options.hidden||this.body.nodeIndices.push(t[i].id));for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var n=e[o],r=t[n.fromId],s=t[n.toId],a=void 0!==r&&void 0!==s;!this.clustering._isClusteredEdge(o)&&!1===n.options.hidden&&a&&!1===r.options.hidden&&!1===s.options.hidden&&this.body.edgeIndices.push(n.id);}},mp.prototype.bindEventListeners=function(){var t=this;this.body.emitter.on("_dataChanged",(function(){t.edgesHandler._updateState(),t.body.emitter.emit("_dataUpdated");})),this.body.emitter.on("_dataUpdated",(function(){t.clustering._updateState(),t._updateVisibleIndices(),t._updateValueRange(t.body.nodes),t._updateValueRange(t.body.edges),t.body.emitter.emit("startSimulation"),t.body.emitter.emit("_requestRedraw");}));},mp.prototype.setData=function(t){if(this.body.emitter.emit("resetPhysics"),this.body.emitter.emit("_resetData"),this.selectionHandler.unselectAll(),t&&t.dot&&(t.nodes||t.edges))throw new SyntaxError('Data must contain either parameter "dot" or  parameter pair "nodes" and "edges", but not both.');if(this.setOptions(t&&t.options),t&&t.dot){console.warn("The dot property has been deprecated. Please use the static convertDot method to convert DOT into vis.network format and use the normal data format with nodes and edges. This converter is used like this: var data = vis.network.convertDot(dotString);");var e=Js(t.dot);this.setData(e);}else if(t&&t.gephi){console.warn("The gephi property has been deprecated. Please use the static convertGephi method to convert gephi into vis.network format and use the normal data format with nodes and edges. This converter is used like this: var data = vis.network.convertGephi(gephiJson);");var i=ea(t.gephi);this.setData(i);}else this.nodesHandler.setData(t&&t.nodes,!0),this.edgesHandler.setData(t&&t.edges,!0),this.body.emitter.emit("_dataChanged"),this.body.emitter.emit("_dataLoaded"),this.body.emitter.emit("initPhysics");},mp.prototype.destroy=function(){for(var t in this.body.emitter.emit("destroy"),this.body.emitter.off(),this.off(),delete this.groups,delete this.canvas,delete this.selectionHandler,delete this.interactionHandler,delete this.view,delete this.renderer,delete this.physics,delete this.layoutEngine,delete this.clustering,delete this.manipulation,delete this.nodesHandler,delete this.edgesHandler,delete this.configurator,delete this.images,this.body.nodes)Object.prototype.hasOwnProperty.call(this.body.nodes,t)&&delete this.body.nodes[t];for(var e in this.body.edges)Object.prototype.hasOwnProperty.call(this.body.edges,e)&&delete this.body.edges[e];Dr(this.body.container);},mp.prototype._updateValueRange=function(t){var e,i=void 0,o=void 0,n=0;for(e in t)if(Object.prototype.hasOwnProperty.call(t,e)){var r=t[e].getValue();void 0!==r&&(i=void 0===i?r:Math.min(r,i),o=void 0===o?r:Math.max(r,o),n+=r);}if(void 0!==i&&void 0!==o)for(e in t)Object.prototype.hasOwnProperty.call(t,e)&&t[e].setValueRange(i,o,n);},mp.prototype.isActive=function(){return !this.activator||this.activator.active},mp.prototype.setSize=function(){return this.canvas.setSize.apply(this.canvas,arguments)},mp.prototype.canvasToDOM=function(){return this.canvas.canvasToDOM.apply(this.canvas,arguments)},mp.prototype.DOMtoCanvas=function(){return this.canvas.DOMtoCanvas.apply(this.canvas,arguments)},mp.prototype.findNode=function(){return this.clustering.findNode.apply(this.clustering,arguments)},mp.prototype.isCluster=function(){return this.clustering.isCluster.apply(this.clustering,arguments)},mp.prototype.openCluster=function(){return this.clustering.openCluster.apply(this.clustering,arguments)},mp.prototype.cluster=function(){return this.clustering.cluster.apply(this.clustering,arguments)},mp.prototype.getNodesInCluster=function(){return this.clustering.getNodesInCluster.apply(this.clustering,arguments)},mp.prototype.clusterByConnection=function(){return this.clustering.clusterByConnection.apply(this.clustering,arguments)},mp.prototype.clusterByHubsize=function(){return this.clustering.clusterByHubsize.apply(this.clustering,arguments)},mp.prototype.updateClusteredNode=function(){return this.clustering.updateClusteredNode.apply(this.clustering,arguments)},mp.prototype.getClusteredEdges=function(){return this.clustering.getClusteredEdges.apply(this.clustering,arguments)},mp.prototype.getBaseEdge=function(){return this.clustering.getBaseEdge.apply(this.clustering,arguments)},mp.prototype.getBaseEdges=function(){return this.clustering.getBaseEdges.apply(this.clustering,arguments)},mp.prototype.updateEdge=function(){return this.clustering.updateEdge.apply(this.clustering,arguments)},mp.prototype.clusterOutliers=function(){return this.clustering.clusterOutliers.apply(this.clustering,arguments)},mp.prototype.getSeed=function(){return this.layoutEngine.getSeed.apply(this.layoutEngine,arguments)},mp.prototype.enableEditMode=function(){return this.manipulation.enableEditMode.apply(this.manipulation,arguments)},mp.prototype.disableEditMode=function(){return this.manipulation.disableEditMode.apply(this.manipulation,arguments)},mp.prototype.addNodeMode=function(){return this.manipulation.addNodeMode.apply(this.manipulation,arguments)},mp.prototype.editNode=function(){return this.manipulation.editNode.apply(this.manipulation,arguments)},mp.prototype.editNodeMode=function(){return console.warn("Deprecated: Please use editNode instead of editNodeMode."),this.manipulation.editNode.apply(this.manipulation,arguments)},mp.prototype.addEdgeMode=function(){return this.manipulation.addEdgeMode.apply(this.manipulation,arguments)},mp.prototype.editEdgeMode=function(){return this.manipulation.editEdgeMode.apply(this.manipulation,arguments)},mp.prototype.deleteSelected=function(){return this.manipulation.deleteSelected.apply(this.manipulation,arguments)},mp.prototype.getPositions=function(){return this.nodesHandler.getPositions.apply(this.nodesHandler,arguments)},mp.prototype.getPosition=function(){return this.nodesHandler.getPosition.apply(this.nodesHandler,arguments)},mp.prototype.storePositions=function(){return this.nodesHandler.storePositions.apply(this.nodesHandler,arguments)},mp.prototype.moveNode=function(){return this.nodesHandler.moveNode.apply(this.nodesHandler,arguments)},mp.prototype.getBoundingBox=function(){return this.nodesHandler.getBoundingBox.apply(this.nodesHandler,arguments)},mp.prototype.getConnectedNodes=function(t){return void 0!==this.body.nodes[t]?this.nodesHandler.getConnectedNodes.apply(this.nodesHandler,arguments):this.edgesHandler.getConnectedNodes.apply(this.edgesHandler,arguments)},mp.prototype.getConnectedEdges=function(){return this.nodesHandler.getConnectedEdges.apply(this.nodesHandler,arguments)},mp.prototype.startSimulation=function(){return this.physics.startSimulation.apply(this.physics,arguments)},mp.prototype.stopSimulation=function(){return this.physics.stopSimulation.apply(this.physics,arguments)},mp.prototype.stabilize=function(){return this.physics.stabilize.apply(this.physics,arguments)},mp.prototype.getSelection=function(){return this.selectionHandler.getSelection.apply(this.selectionHandler,arguments)},mp.prototype.setSelection=function(){return this.selectionHandler.setSelection.apply(this.selectionHandler,arguments)},mp.prototype.getSelectedNodes=function(){return this.selectionHandler.getSelectedNodeIds.apply(this.selectionHandler,arguments)},mp.prototype.getSelectedEdges=function(){return this.selectionHandler.getSelectedEdgeIds.apply(this.selectionHandler,arguments)},mp.prototype.getNodeAt=function(){var t=this.selectionHandler.getNodeAt.apply(this.selectionHandler,arguments);return void 0!==t&&void 0!==t.id?t.id:t},mp.prototype.getEdgeAt=function(){var t=this.selectionHandler.getEdgeAt.apply(this.selectionHandler,arguments);return void 0!==t&&void 0!==t.id?t.id:t},mp.prototype.selectNodes=function(){return this.selectionHandler.selectNodes.apply(this.selectionHandler,arguments)},mp.prototype.selectEdges=function(){return this.selectionHandler.selectEdges.apply(this.selectionHandler,arguments)},mp.prototype.unselectAll=function(){this.selectionHandler.unselectAll.apply(this.selectionHandler,arguments),this.redraw();},mp.prototype.redraw=function(){return this.renderer.redraw.apply(this.renderer,arguments)},mp.prototype.getScale=function(){return this.view.getScale.apply(this.view,arguments)},mp.prototype.getViewPosition=function(){return this.view.getViewPosition.apply(this.view,arguments)},mp.prototype.fit=function(){return this.view.fit.apply(this.view,arguments)},mp.prototype.moveTo=function(){return this.view.moveTo.apply(this.view,arguments)},mp.prototype.focus=function(){return this.view.focus.apply(this.view,arguments)},mp.prototype.releaseNode=function(){return this.view.releaseNode.apply(this.view,arguments)},mp.prototype.getOptionsFromConfigurator=function(){var t={};return this.configurator&&(t=this.configurator.getOptions.apply(this.configurator)),t};var bp=Js;t.Network=mp,t.NetworkImages=Jh,t.networkDOTParser=ta,t.networkGephiParser=ia,t.networkOptions=vp,t.parseDOTNetwork=bp,t.parseGephiNetwork=ea,Object.defineProperty(t,"__esModule",{value:!0});}));

    });

    /* src/Viz.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1 } = globals;
    const file$5 = "src/Viz.svelte";

    function create_fragment$5(ctx) {
    	let p;
    	let input;
    	let t1;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Cutoff: negative will preform substr. Positive will break by wordcount";
    			input = element("input");
    			t1 = space();
    			div = element("div");
    			add_location(p, file$5, 107, 0, 2550);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "-50");
    			attr_dev(input, "max", "10");
    			add_location(input, file$5, 107, 77, 2627);
    			attr_dev(div, "id", "mynetwork");
    			attr_dev(div, "class", "svelte-1gdbbiz");
    			add_location(div, file$5, 110, 0, 2684);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*breaks*/ ctx[0]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*breaks*/ 1 && to_number(input.value) !== /*breaks*/ ctx[0]) {
    				set_input_value(input, /*breaks*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Viz", slots, []);
    	let { messages } = $$props;
    	let breaks = -20;
    	let network = null;
    	let container = null;

    	function makeNetwork(container, data) {
    		if (container === null) return null;
    		return new visNetwork_min.Network(container, data, {});
    	}

    	function insertBreaks(text) {
    		var res = text.split(" ");
    		let newText = "";
    		var i = 0;

    		if (breaks < 0) {
    			return text.substr(0, -breaks);
    		}

    		for (i = 0; i < res.length; i++) {
    			newText += res[i];

    			if (i % breaks == breaks - 1) {
    				newText += "\n";
    			} else {
    				newText += " ";
    			}
    		}

    		// console.log(newText);
    		return newText;
    	}

    	function makeNodes(messages) {
    		// for every message, make a node with id and label
    		var keys = Object.keys(messages);

    		var nodes = new visData_min.DataSet([]); //   { id: 1, label: "Node 1" },

    		keys.forEach(key => {
    			nodes.add({
    				id: key,
    				label: insertBreaks(messages[key].body)
    			}); // label: messages[key].body.substr(0, 5)
    		}); // console.log("message:", messages[key].body.substr(0, 5));

    		return nodes;
    	}

    	function makeEdges(messages) {
    		var keys = Object.keys(messages);
    		var edges = new visData_min.DataSet([]);

    		keys.forEach(key => {
    			messages[key].after.forEach(aft => {
    				edges.add({ from: key, to: aft });
    			});

    			messages[key].before.forEach(bel => {
    				edges.add({ from: bel, to: key });
    			});
    		});

    		return edges;
    	}

    	function makeData(messages) {
    		return {
    			nodes: makeNodes(messages),
    			edges: makeEdges(messages)
    		};
    	}

    	onMount(async () => {
    		$$invalidate(2, container = document.getElementById("mynetwork"));
    	});

    	const writable_props = ["messages"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Viz> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		breaks = to_number(this.value);
    		(($$invalidate(0, breaks), $$invalidate(2, container)), $$invalidate(1, messages));
    	}

    	$$self.$$set = $$props => {
    		if ("messages" in $$props) $$invalidate(1, messages = $$props.messages);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		DataSet: visData_min.DataSet,
    		Network: visNetwork_min.Network,
    		messages,
    		breaks,
    		network,
    		container,
    		makeNetwork,
    		insertBreaks,
    		makeNodes,
    		makeEdges,
    		makeData
    	});

    	$$self.$inject_state = $$props => {
    		if ("messages" in $$props) $$invalidate(1, messages = $$props.messages);
    		if ("breaks" in $$props) $$invalidate(0, breaks = $$props.breaks);
    		if ("network" in $$props) network = $$props.network;
    		if ("container" in $$props) $$invalidate(2, container = $$props.container);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*breaks, container, messages*/ 7) {
    			 {
    				(($$invalidate(0, breaks), $$invalidate(2, container)), $$invalidate(1, messages)); // this update gets executed whenever something on the RHS of an assignment is updated
    				network = makeNetwork(container, makeData(messages));
    			}
    		}
    	};

    	return [breaks, messages, container, input_input_handler];
    }

    class Viz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { messages: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Viz",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*messages*/ ctx[1] === undefined && !("messages" in props)) {
    			console.warn("<Viz> was created without expected prop 'messages'");
    		}
    	}

    	get messages() {
    		throw new Error("<Viz>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set messages(value) {
    		throw new Error("<Viz>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function getExampleData01() {
        return {
     "74248006": {
      "body": "Occaecat consequat amet dolore reprehenderit aliquip elit voluptate id voluptate. Et ipsum labore est amet nulla ipsum aliqua.",
      "before": [
       "707466210",
       "4233534723"
      ],
      "after": []
     },
     "75824359": {
      "body": "Occaecat in amet dolor eu velit eiusmod id ad ad et consequat aliquip veniam. Aliqua Lorem eiusmod duis irure laboris aliquip aliqua occaecat ipsum et excepteur et irure velit laboris.",
      "before": [
       "1207589036"
      ],
      "after": [
       "276867326",
       "3640387011",
       "3584212286"
      ]
     },
     "154882475": {
      "body": "Consequat nostrud laboris cillum ad ipsum occaecat voluptate. Officia amet exercitation quis adipisicing.",
      "before": [
       "3589203431"
      ],
      "after": [
       "1121457483",
       "2964405365"
      ]
     },
     "163274738": {
      "body": "Eiusmod velit dolore anim fugiat elit labore fugiat veniam et deserunt. Deserunt elit ipsum ad laborum in tempor aliqua pariatur est aliqua exercitation ea aute culpa.",
      "before": [
       "707466210",
       "1207589036"
      ],
      "after": [
       "2966094319",
       "2427484752",
       "3207162459"
      ]
     },
     "179276856": {
      "body": "Ad dolore labore do consectetur consectetur anim esse do et amet pariatur ipsum cillum. Nisi sint officia non anim eiusmod ipsum.",
      "before": [
       "179276856"
      ],
      "after": [
       "179276856",
       "3699865740"
      ]
     },
     "276867326": {
      "body": "Aliquip nostrud aliqua commodo dolore labore officia enim esse in. Lorem dolore non est in reprehenderit adipisicing aliqua fugiat qui culpa esse cupidatat.",
      "before": [
       "75824359",
       "2746941700",
       "276867326"
      ],
      "after": [
       "2680268381",
       "638247799",
       "276867326",
       "2658341613",
       "1838328189",
       "3279195542"
      ]
     },
     "391373898": {
      "body": "Mollit anim reprehenderit id nostrud velit est. Ipsum ad culpa in do ut dolore sint duis ipsum.",
      "before": [
       "3207162459"
      ],
      "after": []
     },
     "403084299": {
      "body": "Reprehenderit aute consectetur incididunt veniam fugiat nostrud. Officia ut Lorem esse Lorem minim consectetur do minim exercitation amet amet nulla.",
      "before": [
       "3364029560",
       "3128913948"
      ],
      "after": [
       "468023471",
       "3589203431",
       "1788286218",
       "2291968744"
      ]
     },
     "414380744": {
      "body": "Velit id esse veniam cupidatat ut adipisicing officia aliquip cillum. Nulla irure ea consectetur.",
      "before": [
       "707466210"
      ],
      "after": []
     },
     "468023471": {
      "body": "Id consequat sunt irure exercitation laboris nostrud. Sunt do anim aliqua voluptate anim officia nisi aute minim consequat ex consequat pariatur.",
      "before": [
       "403084299",
       "2966094319",
       "2496846895",
       "917932460"
      ],
      "after": [
       "1559727084",
       "1322655256",
       "575093739"
      ]
     },
     "561760553": {
      "body": "Magna irure voluptate proident deserunt fugiat consectetur. Ex nulla sit nostrud.",
      "before": [
       "3270841991",
       "638247799"
      ],
      "after": [
       "3364029560"
      ]
     },
     "575093739": {
      "body": "Laborum do Lorem ad. Sint eiusmod pariatur nostrud consequat exercitation enim culpa minim do esse cillum.",
      "before": [
       "1207589036",
       "468023471"
      ],
      "after": [
       "884713704"
      ]
     },
     "638247799": {
      "body": "Aliquip sunt elit duis adipisicing duis quis anim aute proident ex aliquip. Proident fugiat est elit voluptate tempor commodo excepteur cillum in.",
      "before": [
       "1607972564",
       "276867326",
       "3175547916"
      ],
      "after": [
       "561760553"
      ]
     },
     "707466210": {
      "body": "Sint ut sint adipisicing reprehenderit ea do magna. Deserunt nisi velit aute ea esse ea nulla deserunt aliquip eiusmod dolore ad velit.",
      "before": [],
      "after": [
       "163274738",
       "3379594008",
       "74248006",
       "2363882614",
       "414380744"
      ]
     },
     "771729653": {
      "body": "Consequat deserunt aliqua minim et enim do nulla. In laboris anim anim dolor sunt irure consequat velit officia.",
      "before": [
       "3262535469"
      ],
      "after": []
     },
     "884713704": {
      "body": "Mollit mollit reprehenderit aute commodo elit sit. Id sint do dolor duis ut.",
      "before": [
       "1207589036",
       "575093739"
      ],
      "after": []
     },
     "917932460": {
      "body": "Culpa irure culpa do sint aliqua. Ad amet occaecat amet in fugiat sint sunt dolor voluptate velit sunt nostrud fugiat.",
      "before": [
       "4075599218"
      ],
      "after": [
       "468023471"
      ]
     },
     "1040217668": {
      "body": "Velit ipsum irure officia labore enim non qui. Ullamco velit ex fugiat labore.",
      "before": [
       "3640387011"
      ],
      "after": [
       "3699865740"
      ]
     },
     "1121457483": {
      "body": "Ea sint in adipisicing commodo duis sunt. Excepteur magna nisi anim minim magna excepteur fugiat amet ut eu.",
      "before": [
       "1121457483",
       "2198948644",
       "2680268381",
       "154882475"
      ],
      "after": [
       "1121457483",
       "707466210",
       "2114065808",
       "638247799",
       "2680268381"
      ]
     },
     "1143781795": {
      "body": "Tempor incididunt esse nostrud nisi nostrud ad minim ullamco adipisicing. Consectetur irure dolore quis quis fugiat quis.",
      "before": [
       "2291968744"
      ],
      "after": []
     },
     "1188891523": {
      "body": "Incididunt duis dolore id. Occaecat duis nostrud eu.",
      "before": [
       "2363882614",
       "3835484133"
      ],
      "after": []
     },
     "1207589036": {
      "body": "Proident dolor esse non enim enim fugiat ex do aliqua anim. Nostrud magna deserunt commodo ad fugiat nisi in minim ad commodo.",
      "before": [
       "1623518994"
      ],
      "after": [
       "75824359",
       "2680268381",
       "163274738",
       "575093739",
       "884713704"
      ]
     },
     "1322655256": {
      "body": "Velit nostrud aliquip veniam dolor sunt. Velit amet laboris ipsum enim sint eu cupidatat commodo dolore ullamco est.",
      "before": [
       "468023471"
      ],
      "after": []
     },
     "1438188295": {
      "body": "Duis id eu cupidatat anim mollit sint amet in et aute. Officia do tempor qui anim fugiat quis ipsum est occaecat sunt.",
      "before": [
       "3878777134"
      ],
      "after": [
       "2966094319"
      ]
     },
     "1522982810": {
      "body": "Non ea amet amet aute deserunt aute sint excepteur elit exercitation adipisicing deserunt do deserunt reprehenderit. Et exercitation deserunt excepteur occaecat esse tempor quis laborum adipisicing aute incididunt officia.",
      "before": [
       "2291968744"
      ],
      "after": []
     },
     "1559727084": {
      "body": "Sit minim enim sunt proident consectetur tempor ad quis. Ea amet mollit nostrud cupidatat reprehenderit ullamco commodo proident reprehenderit consequat do quis ex.",
      "before": [
       "468023471",
       "3589203431"
      ],
      "after": [
       "1838328189"
      ]
     },
     "1607972564": {
      "body": "Aliqua cupidatat culpa magna et amet et enim culpa ea. Laboris ea eu cillum magna quis.",
      "before": [
       "2680268381"
      ],
      "after": [
       "638247799",
       "2746941700",
       "4075599218",
       "3835484133"
      ]
     },
     "1623518994": {
      "body": "Ipsum irure ad labore commodo nulla et. Sunt in exercitation pariatur anim consectetur nisi elit minim.",
      "before": [
       "2153903859"
      ],
      "after": [
       "1207589036",
       "4159876800",
       "3270841991"
      ]
     },
     "1629725719": {
      "body": "Ipsum irure proident ad dolor velit esse ea dolore consequat minim sunt deserunt. Aliqua fugiat nisi magna laborum quis.",
      "before": [
       "2198948644"
      ],
      "after": []
     },
     "1747597502": {
      "body": "Excepteur velit eiusmod aliquip culpa minim dolore deserunt ea est anim aliqua exercitation. Deserunt id ut eiusmod ea duis cillum cupidatat dolore nulla officia.",
      "before": [
       "3347367062"
      ],
      "after": []
     },
     "1788286218": {
      "body": "Tempor anim consequat aliqua id. Eu pariatur ullamco duis ullamco officia magna laborum occaecat cillum laborum cillum quis sunt elit.",
      "before": [
       "403084299"
      ],
      "after": [
       "2964405365"
      ]
     },
     "1838328189": {
      "body": "Mollit ut cillum ut. Nulla sint do minim cupidatat anim ad laboris ad ex in.",
      "before": [
       "1559727084"
      ],
      "after": []
     },
     "2114065808": {
      "body": "Adipisicing deserunt et irure enim ullamco non minim cupidatat est ipsum nostrud amet. Aute id officia non nisi ea adipisicing aliquip magna Lorem.",
      "before": [
       "2746941700"
      ],
      "after": []
     },
     "2153903859": {
      "body": "Quis enim incididunt laborum nulla in dolor. Nostrud pariatur pariatur occaecat officia consectetur cillum laboris non labore laboris.",
      "before": [
       "3262535469"
      ],
      "after": [
       "1623518994"
      ]
     },
     "2198948644": {
      "body": "Voluptate velit Lorem quis. Laborum duis sunt ut enim quis qui deserunt adipisicing ea fugiat id est consequat anim.",
      "before": [
       "3364029560"
      ],
      "after": [
       "3128913948",
       "1121457483",
       "1629725719"
      ]
     },
     "2291968744": {
      "body": "Ut ex aute et anim. Lorem eiusmod deserunt anim minim consectetur Lorem exercitation anim ex aliquip ut officia magna.",
      "before": [
       "3878777134",
       "403084299"
      ],
      "after": [
       "1522982810",
       "1143781795"
      ]
     },
     "2363882614": {
      "body": "Minim sit anim cillum tempor est eu nisi fugiat pariatur anim culpa veniam ipsum mollit. Excepteur laboris voluptate elit anim sint.",
      "before": [
       "707466210"
      ],
      "after": [
       "1188891523",
       "3207162459",
       "3175547916"
      ]
     },
     "2427484752": {
      "body": "Quis incididunt quis eiusmod enim mollit eu fugiat deserunt. Ullamco amet fugiat consectetur enim.",
      "before": [
       "163274738"
      ],
      "after": []
     },
     "2496846895": {
      "body": "Laborum in quis cillum proident ut enim. Exercitation ex sunt eiusmod excepteur occaecat dolor esse ex aliqua.",
      "before": [
       "3835484133"
      ],
      "after": [
       "468023471"
      ]
     },
     "2658341613": {
      "body": "Proident incididunt qui nulla excepteur. Eu deserunt duis do aute.",
      "before": [],
      "after": []
     },
     "2680268381": {
      "body": "Proident et veniam voluptate mollit enim ullamco anim aliquip cillum sint magna sint. Consequat ad laboris minim dolore est ullamco consequat magna in deserunt cupidatat anim cillum.",
      "before": [
       "1207589036",
       "276867326",
       "3364029560"
      ],
      "after": [
       "1607972564",
       "1121457483"
      ]
     },
     "1": {
      "body": "Non fugiat sint consectetur in in. Sint in elit minim eu dolor aliqua anim consectetur dolor ullamco voluptate pariatur Lorem.",
      "before": [
       "1607972564",
       "3379594008"
      ],
      "after": [
       "276867326",
       "2114065808",
       "3270841991"
      ]
     },
     "2789491189": {
      "body": "Aliquip qui esse sit officia exercitation proident voluptate eu reprehenderit qui nostrud aliqua aliquip pariatur. Deserunt aliqua velit enim amet duis irure nostrud nostrud adipisicing anim.",
      "before": [
       "2789491189"
      ],
      "after": [
       "2789491189",
       "1207589036",
       "2198948644"
      ]
     },
     "2904980079": {
      "body": "Enim consectetur mollit aliquip duis quis proident magna culpa culpa sit est eiusmod. Eu eu aliqua ea id Lorem ullamco dolore nostrud labore laboris aute.",
      "before": [
       "2904980079"
      ],
      "after": [
       "2904980079",
       "2658341613"
      ]
     },
     "2964405365": {
      "body": "Ipsum eiusmod anim laborum esse tempor pariatur veniam cillum velit culpa amet Lorem. Duis labore Lorem esse incididunt tempor laboris aliquip excepteur dolore est dolor excepteur magna in.",
      "before": [
       "4075599218",
       "154882475",
       "1788286218"
      ],
      "after": []
     },
     "2966094319": {
      "body": "Et qui sunt ipsum officia anim ipsum do aliquip Lorem. Est laborum incididunt ad esse.",
      "before": [
       "163274738",
       "1438188295"
      ],
      "after": [
       "468023471"
      ]
     },
     "3128913948": {
      "body": "Magna ea id proident irure reprehenderit veniam. Incididunt nostrud deserunt veniam enim culpa nulla proident consequat laboris dolor deserunt incididunt nostrud adipisicing.",
      "before": [
       "2198948644"
      ],
      "after": [
       "3279195542",
       "403084299"
      ]
     },
     "3175547916": {
      "body": "Et minim veniam culpa. Officia est enim est do voluptate anim excepteur qui cupidatat ullamco.",
      "before": [
       "2363882614"
      ],
      "after": [
       "638247799"
      ]
     },
     "3207162459": {
      "body": "Amet officia aliquip commodo velit aute cupidatat. Elit non cillum dolor labore do veniam quis culpa sint tempor non cillum minim.",
      "before": [
       "2363882614",
       "163274738"
      ],
      "after": [
       "391373898"
      ]
     },
     "3262535469": {
      "body": "Non proident sunt nisi reprehenderit consectetur pariatur minim pariatur proident sunt consectetur velit ex ipsum ullamco. Voluptate reprehenderit proident do eiusmod Lorem nisi incididunt eu consequat voluptate ipsum.",
      "before": [
       "3379594008"
      ],
      "after": [
       "2153903859",
       "771729653"
      ]
     },
     "3270841991": {
      "body": "Quis quis ipsum tempor cupidatat laborum sunt mollit aliquip duis voluptate sunt irure occaecat. Id cupidatat aute aliqua consequat aute excepteur ut incididunt est et ea.",
      "before": [
       "2746941700",
       "1623518994"
      ],
      "after": [
       "561760553"
      ]
     },
     "3279195542": {
      "body": "Aute sunt aliquip Lorem pariatur eiusmod qui. Et excepteur dolore do ad.",
      "before": [
       "3128913948"
      ],
      "after": []
     },
     "3347367062": {
      "body": "Magna nostrud ipsum incididunt cupidatat adipisicing id mollit fugiat. Culpa aute enim aliquip irure ad labore do.",
      "before": [
       "3379594008"
      ],
      "after": [
       "1747597502",
       "3878777134"
      ]
     },
     "3364029560": {
      "body": "Incididunt cillum proident minim commodo est cupidatat pariatur duis commodo enim laborum do. Exercitation sunt id reprehenderit cupidatat elit amet mollit.",
      "before": [
       "561760553"
      ],
      "after": [
       "403084299",
       "4067520009",
       "2198948644",
       "2680268381"
      ]
     },
     "3379594008": {
      "body": "Ad ullamco proident ipsum magna ipsum ipsum duis sint enim. Labore sunt commodo laboris ad adipisicing amet dolore deserunt.",
      "before": [
       "707466210"
      ],
      "after": [
       "2746941700",
       "3347367062",
       "3262535469"
      ]
     },
     "3584212286": {
      "body": "Aute culpa aliquip sit quis magna sunt do adipisicing eiusmod et nostrud anim pariatur cillum. Nisi occaecat adipisicing mollit id esse quis cillum.",
      "before": [
       "75824359"
      ],
      "after": []
     },
     "3589203431": {
      "body": "Et veniam duis reprehenderit exercitation. Consectetur esse eu laboris aute veniam.",
      "before": [
       "403084299"
      ],
      "after": [
       "154882475",
       "1559727084"
      ]
     },
     "3640387011": {
      "body": "Ea culpa sint id consectetur nisi quis minim ea ea. Occaecat minim et consequat esse eu ullamco dolore.",
      "before": [
       "75824359"
      ],
      "after": [
       "1040217668"
      ]
     },
     "3699865740": {
      "body": "In Lorem aliquip ullamco Lorem do qui anim. Proident nisi consectetur duis aliquip pariatur aute do laboris eiusmod consectetur.",
      "before": [
       "1040217668",
       "4067520009"
      ],
      "after": []
     },
     "3835484133": {
      "body": "Excepteur qui deserunt nulla Lorem ut consectetur excepteur ex in. Incididunt nulla in aliquip enim excepteur voluptate amet laborum ullamco est consectetur.",
      "before": [
       "1607972564",
       "4233534723"
      ],
      "after": [
       "2496846895",
       "1188891523"
      ]
     },
     "3878777134": {
      "body": "Fugiat pariatur ut ipsum tempor dolore aute consequat laboris ad do commodo duis. Velit irure officia id veniam aliquip qui deserunt nulla in sunt cillum do nisi.",
      "before": [
       "3347367062"
      ],
      "after": [
       "2291968744",
       "1438188295"
      ]
     },
     "4067520009": {
      "body": "Nostrud incididunt cillum consectetur sit irure officia commodo id et ut laborum voluptate fugiat amet. Et quis adipisicing adipisicing eiusmod commodo culpa adipisicing incididunt eu in enim aute dolore enim.",
      "before": [
       "3364029560"
      ],
      "after": [
       "3699865740"
      ]
     },
     "4075599218": {
      "body": "Do est dolor tempor aute. In et sunt irure sit ipsum amet magna.",
      "before": [
       "1607972564"
      ],
      "after": [
       "4159876800",
       "2964405365",
       "917932460"
      ]
     },
     "4159876800": {
      "body": "Minim deserunt duis reprehenderit sit. Culpa adipisicing ipsum est sint nostrud voluptate ut mollit fugiat dolor proident aliqua ad.",
      "before": [
       "4075599218",
       "1623518994"
      ],
      "after": [
       "4233534723"
      ]
     },
     "4233534723": {
      "body": "Esse amet pariatur irure quis. Commodo amet duis aute sint voluptate excepteur tempor aliquip ipsum.",
      "before": [
       "4159876800"
      ],
      "after": [
       "3835484133",
       "74248006"
      ]
     }
    }
    }



    function getExampleData02() {
        return {
            "1": {
                "body": "Esse amet pariatur irure quis. Commodo amet duis aute sint voluptate excepteur tempor aliquip ipsum.",
                "before": [],
                "after": []
               }
        };
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1$1 } = globals;

    const file$6 = "src/App.svelte";

    // (170:0) {#if SHOW_VIZ}
    function create_if_block_2$1(ctx) {
    	let viz;
    	let current;

    	viz = new Viz({
    			props: { messages: /*messages*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(viz.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(viz, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const viz_changes = {};
    			if (dirty & /*messages*/ 8) viz_changes.messages = /*messages*/ ctx[3];
    			viz.$set(viz_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(viz.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(viz.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(viz, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(170:0) {#if SHOW_VIZ}",
    		ctx
    	});

    	return block;
    }

    // (174:0) {#if SHOW_SWIPE}
    function create_if_block_1$1(ctx) {
    	let p;
    	let t1;
    	let h2;
    	let t3;
    	let input;
    	let t4;
    	let button;
    	let t6;
    	let conversation;
    	let current;
    	let mounted;
    	let dispose;

    	conversation = new Conversation({
    			props: {
    				messages: /*messages*/ ctx[3],
    				focus: /*focus*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "(If messages appear to overlap, toggle swipe on and off again.)";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Swipe left and right on Before and After cards to browse branches";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "ATTACH TO FOCUS";
    			t6 = space();
    			create_component(conversation.$$.fragment);
    			add_location(p, file$6, 174, 0, 3119);
    			add_location(h2, file$6, 175, 0, 3190);
    			add_location(input, file$6, 176, 1, 3266);
    			add_location(button, file$6, 177, 1, 3302);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*next_message*/ ctx[5]);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(conversation, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[14]),
    					listen_dev(button, "click", /*handleAttachToFocus*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*next_message*/ 32 && input.value !== /*next_message*/ ctx[5]) {
    				set_input_value(input, /*next_message*/ ctx[5]);
    			}

    			const conversation_changes = {};
    			if (dirty & /*messages*/ 8) conversation_changes.messages = /*messages*/ ctx[3];
    			if (dirty & /*focus*/ 16) conversation_changes.focus = /*focus*/ ctx[4];
    			conversation.$set(conversation_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(conversation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(conversation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t6);
    			destroy_component(conversation, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(174:0) {#if SHOW_SWIPE}",
    		ctx
    	});

    	return block;
    }

    // (183:0) {#if SHOW_DEBUG}
    function create_if_block$2(ctx) {
    	let pre;
    	let t0;
    	let t1_value = JSON.stringify(/*messages*/ ctx[3], null, " ") + "";
    	let t1;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t0 = text("State Debug:\n");
    			t1 = text(t1_value);
    			add_location(pre, file$6, 183, 0, 3443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t0);
    			append_dev(pre, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*messages*/ 8 && t1_value !== (t1_value = JSON.stringify(/*messages*/ ctx[3], null, " ") + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(183:0) {#if SHOW_DEBUG}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let button0;
    	let t1;
    	let br0;
    	let t2;
    	let button1;
    	let t4;
    	let button2;
    	let t6;
    	let button3;
    	let t8;
    	let br1;
    	let t9;
    	let button4;

    	let t10_value = (/*SHOW_VIZ*/ ctx[0]
    	? "Showing vis-network"
    	: "Hiding vis-network") + "";

    	let t10;
    	let t11;
    	let button5;
    	let t12_value = (/*SHOW_SWIPE*/ ctx[1] ? "Showing swipe" : "Hiding swipe") + "";
    	let t12;
    	let t13;
    	let button6;

    	let t14_value = (/*SHOW_DEBUG*/ ctx[2]
    	? "Showing state debug"
    	: "Hiding state debug") + "";

    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let if_block2_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*SHOW_VIZ*/ ctx[0] && create_if_block_2$1(ctx);
    	let if_block1 = /*SHOW_SWIPE*/ ctx[1] && create_if_block_1$1(ctx);
    	let if_block2 = /*SHOW_DEBUG*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "GOTO RANDOM";
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "RESET";
    			t4 = space();
    			button2 = element("button");
    			button2.textContent = "ADD RANDOM MSG";
    			t6 = space();
    			button3 = element("button");
    			button3.textContent = "ADD RANDOM LINK";
    			t8 = space();
    			br1 = element("br");
    			t9 = space();
    			button4 = element("button");
    			t10 = text(t10_value);
    			t11 = space();
    			button5 = element("button");
    			t12 = text(t12_value);
    			t13 = space();
    			button6 = element("button");
    			t14 = text(t14_value);
    			t15 = space();
    			if (if_block0) if_block0.c();
    			t16 = space();
    			if (if_block1) if_block1.c();
    			t17 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			add_location(button0, file$6, 126, 0, 2404);
    			add_location(br0, file$6, 130, 0, 2459);
    			add_location(button1, file$6, 132, 0, 2467);
    			add_location(button2, file$6, 136, 0, 2517);
    			add_location(button3, file$6, 140, 0, 2584);
    			add_location(br1, file$6, 146, 0, 2651);
    			add_location(button4, file$6, 149, 0, 2660);
    			add_location(button5, file$6, 153, 0, 2779);
    			add_location(button6, file$6, 157, 0, 2892);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, button2, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, button3, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, button4, anchor);
    			append_dev(button4, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, button5, anchor);
    			append_dev(button5, t12);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, button6, anchor);
    			append_dev(button6, t14);
    			insert_dev(target, t15, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t16, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t17, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*gotoRandom*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*handleReset*/ ctx[8], false, false, false),
    					listen_dev(button2, "click", /*handleRandomMessage*/ ctx[6], false, false, false),
    					listen_dev(button3, "click", /*handleRandomLink*/ ctx[7], false, false, false),
    					listen_dev(button4, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button5, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(button6, "click", /*click_handler_2*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*SHOW_VIZ*/ 1) && t10_value !== (t10_value = (/*SHOW_VIZ*/ ctx[0]
    			? "Showing vis-network"
    			: "Hiding vis-network") + "")) set_data_dev(t10, t10_value);

    			if ((!current || dirty & /*SHOW_SWIPE*/ 2) && t12_value !== (t12_value = (/*SHOW_SWIPE*/ ctx[1] ? "Showing swipe" : "Hiding swipe") + "")) set_data_dev(t12, t12_value);

    			if ((!current || dirty & /*SHOW_DEBUG*/ 4) && t14_value !== (t14_value = (/*SHOW_DEBUG*/ ctx[2]
    			? "Showing state debug"
    			: "Hiding state debug") + "")) set_data_dev(t14, t14_value);

    			if (/*SHOW_VIZ*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*SHOW_VIZ*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t16.parentNode, t16);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*SHOW_SWIPE*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*SHOW_SWIPE*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t17.parentNode, t17);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*SHOW_DEBUG*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(button2);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(button3);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(button4);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(button5);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(button6);
    			if (detaching) detach_dev(t15);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t16);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t17);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getEmptyMessage() {
    	return { body: null, before: [], after: [] };
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let getExampleData = getExampleData02;

    	const lorem = new dist.LoremIpsum({
    			sentencesPerParagraph: { max: 8, min: 4 },
    			wordsPerSentence: { max: 16, min: 4 }
    		});

    	let SHOW_VIZ = false;
    	let SHOW_SWIPE = true;
    	let SHOW_DEBUG = false;

    	function createNewMessage(msg) {
    		let newMsg = getEmptyMessage();
    		let msg_hash = funhash(msg);
    		newMsg.body = msg;
    		$$invalidate(3, messages[msg_hash] = newMsg, messages);
    		createLink(focus, msg_hash);
    	}

    	// Add new random message
    	var funhash = function (s) {
    		for (var i = 0, h = 3735928559; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    		return "" + ((h ^ h >>> 16) >>> 0);
    	};

    	var randomProperty = function (obj) {
    		var keys = Object.keys(obj);
    		return obj[keys[keys.length * Math.random() << 0]];
    	};

    	var randomKey = function (obj) {
    		var keys = Object.keys(obj);
    		return keys[keys.length * Math.random() << 0];
    	};

    	// handles
    	function handleRandomMessage() {
    		let msg_body = lorem.generateSentences(2);
    		let msg_hash = funhash(msg_body);
    		let msg = getEmptyMessage();
    		msg.body = msg_body;
    		$$invalidate(3, messages[msg_hash] = msg, messages);

    		if (focus === null) {
    			$$invalidate(4, focus = msg_hash);
    		} else {
    			let r = randomKey(messages);
    			createLink(r, msg_hash);
    		}
    	}

    	function handleRandomLink() {
    		let a = randomKey(messages);
    		let b = randomKey(messages);
    		createLink(a, b);
    		$$invalidate(3, messages); // sorry rich
    	}

    	function handleReset() {
    		$$invalidate(3, messages = {});
    		$$invalidate(4, focus = null);
    	}

    	function handleAttachToFocus() {
    		if (next_message != null && next_message != "") {
    			let newMsg = createNewMessage(next_message);
    			$$invalidate(5, next_message = "");
    		} // createLink(focus, newMsg);
    	}

    	function gotoRandom() {
    		$$invalidate(4, focus = randomKey(messages));
    	}

    	///
    	function createLink(a, b) {
    		if (!messages[a].after.includes(b)) messages[a].after.push(b);
    		if (!messages[a].before.includes(a)) messages[b].before.push(a);
    	}

    	// MISC
    	let messages = getExampleData();

    	let focus = "1";
    	let focus_list = [];
    	let next_message = "";
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, SHOW_VIZ = !SHOW_VIZ);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(1, SHOW_SWIPE = !SHOW_SWIPE);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(2, SHOW_DEBUG = !SHOW_DEBUG);
    	};

    	function input_input_handler() {
    		next_message = this.value;
    		$$invalidate(5, next_message);
    	}

    	$$self.$capture_state = () => ({
    		Conversation,
    		Viz,
    		LoremIpsum: dist.LoremIpsum,
    		getExampleData01,
    		getExampleData02,
    		getExampleData,
    		lorem,
    		SHOW_VIZ,
    		SHOW_SWIPE,
    		SHOW_DEBUG,
    		getEmptyMessage,
    		createNewMessage,
    		funhash,
    		randomProperty,
    		randomKey,
    		handleRandomMessage,
    		handleRandomLink,
    		handleReset,
    		handleAttachToFocus,
    		gotoRandom,
    		createLink,
    		messages,
    		focus,
    		focus_list,
    		next_message
    	});

    	$$self.$inject_state = $$props => {
    		if ("getExampleData" in $$props) getExampleData = $$props.getExampleData;
    		if ("SHOW_VIZ" in $$props) $$invalidate(0, SHOW_VIZ = $$props.SHOW_VIZ);
    		if ("SHOW_SWIPE" in $$props) $$invalidate(1, SHOW_SWIPE = $$props.SHOW_SWIPE);
    		if ("SHOW_DEBUG" in $$props) $$invalidate(2, SHOW_DEBUG = $$props.SHOW_DEBUG);
    		if ("funhash" in $$props) funhash = $$props.funhash;
    		if ("randomProperty" in $$props) randomProperty = $$props.randomProperty;
    		if ("randomKey" in $$props) randomKey = $$props.randomKey;
    		if ("messages" in $$props) $$invalidate(3, messages = $$props.messages);
    		if ("focus" in $$props) $$invalidate(4, focus = $$props.focus);
    		if ("focus_list" in $$props) focus_list = $$props.focus_list;
    		if ("next_message" in $$props) $$invalidate(5, next_message = $$props.next_message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		SHOW_VIZ,
    		SHOW_SWIPE,
    		SHOW_DEBUG,
    		messages,
    		focus,
    		next_message,
    		handleRandomMessage,
    		handleRandomLink,
    		handleReset,
    		handleAttachToFocus,
    		gotoRandom,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    // import App from './Viz.svelte';

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
