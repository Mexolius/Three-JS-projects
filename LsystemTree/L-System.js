export default class LSystem {
    // axiom -> starting string for L-System
    // rules -> set of rules in a format of Map<char, [Object<CDF,output>]>
    // CDF -> Cumulative distribution function, last entry MUST have the CDF == 1.0 - the return of Math.random() i (0,1) and cdf is the threshold to compare it with.
    // IE. entry [0.33, FRF] yeilds FNF only if Math.random() returns less than 0.33
    constructor({ axiom, rules }) {
        this._axiom = axiom;
        this._rules = rules;
        this._alphabet = [...rules.keys()];
    }

    iteration() {
        //let ret='';
        //for (const x of this._axiom) ret+=this._alphabet.includes(x)?this.apply_rule(x):x;
        //this._axiom = ret;

        //~40% faster for large L-Systems (>20 iterations)
        this._axiom = this._axiom.split('').map(x => this._alphabet.includes(x) ? this.#apply_rule(x) : x).join('');
    }

    #apply_rule(symbol) {
        const r = Math.random();
        const e = this._rules.get(symbol);
        for (const entry of e) {
            if (entry.cdf > r) return entry.output;
        }
    }

    get_axiom() {
        return this._axiom;
    }
}

export {LSystem};