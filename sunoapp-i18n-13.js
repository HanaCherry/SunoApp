        if (aliases[prefix] && this.dict[aliases[prefix]]) return aliases[prefix];
        if (this.dict[loc]) return loc;
        if (this.dict[prefix]) return prefix;
        var keys = Object.keys(this.dict);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].toLowerCase() === loc || keys[i].toLowerCase() === prefix) return keys[i];
        }
        return 'en';
    },
    t: function (key, vars, lang) {
        var loc = lang || this.resolve();
        var table = this.dict[loc] || {};
        var s = table[key] || (this.dict.en && this.dict.en[key]) || (this.dict.fr && this.dict.fr[key]) || key;
        if (vars) {
            var ks = Object.keys(vars);
            for (var i = 0; i < ks.length; i++) {
                s = String(s).split('{' + ks[i] + '}').join(vars[ks[i]]);
            }
        }
        return s;
    }

    };
});
