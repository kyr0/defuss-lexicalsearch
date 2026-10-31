// Generated from turkish.sbl by Snowball 3.1.1 (https://snowballstem.org/) with scripts/snowball.mjs; do not edit.
// BSD-3-Clause, Copyright (c) 2001 Dr Martin Porter, (c) 2004,2005 Richard Boulton, (c) 2013 Yoshiki Shibukawa,
// (c) 2006-2025 Olly Betts; the full license text is in snowball.ts.
// VERIFIED: reproduces the output.txt of snowball-data (commit 019921c) for every word of its voc.txt;
// test/languages.test.mjs keeps samples.
// oxlint-disable no-unused-labels
import { SnowballStemmer, type Among } from './snowball';

const a_0: readonly Among[] = [
    ["m", -1],
    ["n", -1],
    ["miz", -1],
    ["niz", -1],
    ["muz", -1],
    ["nuz", -1],
    ["m\u00FCz", -1],
    ["n\u00FCz", -1],
    ["m\u0131z", -1],
    ["n\u0131z", -1]
];

const a_1: readonly Among[] = [
    ["leri", -1],
    ["lar\u0131", -1]
];

const a_2: readonly Among[] = [
    ["ni", -1],
    ["nu", -1],
    ["n\u00FC", -1],
    ["n\u0131", -1]
];

const a_3: readonly Among[] = [
    ["in", -1],
    ["un", -1],
    ["\u00FCn", -1],
    ["\u0131n", -1]
];

const a_4: readonly Among[] = [
    ["a", -1],
    ["e", -1]
];

const a_5: readonly Among[] = [
    ["na", -1],
    ["ne", -1]
];

const a_6: readonly Among[] = [
    ["da", -1],
    ["ta", -1],
    ["de", -1],
    ["te", -1]
];

const a_7: readonly Among[] = [
    ["nda", -1],
    ["nde", -1]
];

const a_8: readonly Among[] = [
    ["dan", -1],
    ["tan", -1],
    ["den", -1],
    ["ten", -1]
];

const a_9: readonly Among[] = [
    ["ndan", -1],
    ["nden", -1]
];

const a_10: readonly Among[] = [
    ["la", -1],
    ["le", -1]
];

const a_11: readonly Among[] = [
    ["ca", -1],
    ["ce", -1]
];

const a_12: readonly Among[] = [
    ["im", -1],
    ["um", -1],
    ["\u00FCm", -1],
    ["\u0131m", -1]
];

const a_13: readonly Among[] = [
    ["sin", -1],
    ["sun", -1],
    ["s\u00FCn", -1],
    ["s\u0131n", -1]
];

const a_14: readonly Among[] = [
    ["iz", -1],
    ["uz", -1],
    ["\u00FCz", -1],
    ["\u0131z", -1]
];

const a_15: readonly Among[] = [
    ["siniz", -1],
    ["sunuz", -1],
    ["s\u00FCn\u00FCz", -1],
    ["s\u0131n\u0131z", -1]
];

const a_16: readonly Among[] = [
    ["lar", -1],
    ["ler", -1]
];

const a_17: readonly Among[] = [
    ["niz", -1],
    ["nuz", -1],
    ["n\u00FCz", -1],
    ["n\u0131z", -1]
];

const a_18: readonly Among[] = [
    ["dir", -1],
    ["tir", -1],
    ["dur", -1],
    ["tur", -1],
    ["d\u00FCr", -1],
    ["t\u00FCr", -1],
    ["d\u0131r", -1],
    ["t\u0131r", -1]
];

const a_19: readonly Among[] = [
    ["cas\u0131na", -1],
    ["cesine", -1]
];

const a_20: readonly Among[] = [
    ["di", -1],
    ["ti", -1],
    ["dik", -1],
    ["tik", -1],
    ["duk", -1],
    ["tuk", -1],
    ["d\u00FCk", -1],
    ["t\u00FCk", -1],
    ["d\u0131k", -1],
    ["t\u0131k", -1],
    ["dim", -1],
    ["tim", -1],
    ["dum", -1],
    ["tum", -1],
    ["d\u00FCm", -1],
    ["t\u00FCm", -1],
    ["d\u0131m", -1],
    ["t\u0131m", -1],
    ["din", -1],
    ["tin", -1],
    ["dun", -1],
    ["tun", -1],
    ["d\u00FCn", -1],
    ["t\u00FCn", -1],
    ["d\u0131n", -1],
    ["t\u0131n", -1],
    ["du", -1],
    ["tu", -1],
    ["d\u00FC", -1],
    ["t\u00FC", -1],
    ["d\u0131", -1],
    ["t\u0131", -1]
];

const a_21: readonly Among[] = [
    ["sa", -1],
    ["se", -1],
    ["sak", -1],
    ["sek", -1],
    ["sam", -1],
    ["sem", -1],
    ["san", -1],
    ["sen", -1]
];

const a_22: readonly Among[] = [
    ["mi\u015F", -1],
    ["mu\u015F", -1],
    ["m\u00FC\u015F", -1],
    ["m\u0131\u015F", -1]
];

const a_23: readonly Among[] = [
    ["b", 1],
    ["c", 2],
    ["d", 3],
    ["\u011F", 4]
];

const as_23: readonly string[] = ["p", "\u00E7", "t", "k"];

const g_vowel: readonly number[] = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 8, 0, 0, 0, 0, 0, 0, 1];

const g_U: readonly number[] = [1, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 1];

const g_vowel1: readonly number[] = [1, 64, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

const g_vowel2: readonly number[] = [17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 130];

const g_vowel3: readonly number[] = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

const g_vowel4: readonly number[] = [17];

const g_vowel5: readonly number[] = [65];

const g_vowel6: readonly number[] = [65];


class TurkishStemmer extends SnowballStemmer {

    #B_continue_stemming_noun_suffixes: boolean = false;
    #r_check_vowel_harmony() {
        const v_1: number = this.limit - this.c;
        if (!this.go_out_grouping_b(g_vowel, 97, 305)) return false;
        lab0: {
            const v_2: number = this.limit - this.c;
            lab1: {
                if (!(this.eq_s_b("a"))) break lab1;
                if (!this.go_out_grouping_b(g_vowel1, 97, 305)) break lab1;
                break lab0;
            }
            this.c = this.limit - v_2;
            lab2: {
                if (!(this.eq_s_b("e"))) break lab2;
                if (!this.go_out_grouping_b(g_vowel2, 101, 252)) break lab2;
                break lab0;
            }
            this.c = this.limit - v_2;
            lab3: {
                if (!(this.eq_s_b("\u0131"))) break lab3;
                if (!this.go_out_grouping_b(g_vowel3, 97, 305)) break lab3;
                break lab0;
            }
            this.c = this.limit - v_2;
            lab4: {
                if (!(this.eq_s_b("i"))) break lab4;
                if (!this.go_out_grouping_b(g_vowel4, 101, 105)) break lab4;
                break lab0;
            }
            this.c = this.limit - v_2;
            lab5: {
                if (!(this.eq_s_b("o"))) break lab5;
                if (!this.go_out_grouping_b(g_vowel5, 111, 117)) break lab5;
                break lab0;
            }
            this.c = this.limit - v_2;
            lab6: {
                if (!(this.eq_s_b("\u00F6"))) break lab6;
                if (!this.go_out_grouping_b(g_vowel6, 246, 252)) break lab6;
                break lab0;
            }
            this.c = this.limit - v_2;
            lab7: {
                if (!(this.eq_s_b("u"))) break lab7;
                if (!this.go_out_grouping_b(g_vowel5, 111, 117)) break lab7;
                break lab0;
            }
            this.c = this.limit - v_2;
            if (!(this.eq_s_b("\u00FC"))) return false;
            if (!this.go_out_grouping_b(g_vowel6, 246, 252)) return false;
        }
        this.c = this.limit - v_1;
        return true;
    }
    #r_mark_suffix_with_optional_n_consonant() {
        lab0: {
            const v_1: number = this.limit - this.c;
            lab1: {
                if (!(this.eq_s_b("n"))) break lab1;
                const v_2: number = this.limit - this.c;
                if (!(this.in_grouping_b(g_vowel, 97, 305))) break lab1;
                this.c = this.limit - v_2;
                break lab0;
            }
            this.c = this.limit - v_1;
            lab2: {
                if (!(this.eq_s_b("n"))) break lab2;
                return false;
            }
            const v_3: number = this.limit - this.c;
            if (this.c <= this.limit_backward) return false;
            this.c--;
            if (!(this.in_grouping_b(g_vowel, 97, 305))) return false;
            this.c = this.limit - v_3;
        }
        return true;
    }
    #r_mark_suffix_with_optional_s_consonant() {
        lab0: {
            const v_1: number = this.limit - this.c;
            lab1: {
                if (!(this.eq_s_b("s"))) break lab1;
                const v_2: number = this.limit - this.c;
                if (!(this.in_grouping_b(g_vowel, 97, 305))) break lab1;
                this.c = this.limit - v_2;
                break lab0;
            }
            this.c = this.limit - v_1;
            lab2: {
                if (!(this.eq_s_b("s"))) break lab2;
                return false;
            }
            const v_3: number = this.limit - this.c;
            if (this.c <= this.limit_backward) return false;
            this.c--;
            if (!(this.in_grouping_b(g_vowel, 97, 305))) return false;
            this.c = this.limit - v_3;
        }
        return true;
    }
    #r_mark_suffix_with_optional_y_consonant() {
        lab0: {
            const v_1: number = this.limit - this.c;
            lab1: {
                if (!(this.eq_s_b("y"))) break lab1;
                const v_2: number = this.limit - this.c;
                if (!(this.in_grouping_b(g_vowel, 97, 305))) break lab1;
                this.c = this.limit - v_2;
                break lab0;
            }
            this.c = this.limit - v_1;
            lab2: {
                if (!(this.eq_s_b("y"))) break lab2;
                return false;
            }
            const v_3: number = this.limit - this.c;
            if (this.c <= this.limit_backward) return false;
            this.c--;
            if (!(this.in_grouping_b(g_vowel, 97, 305))) return false;
            this.c = this.limit - v_3;
        }
        return true;
    }
    #r_mark_suffix_with_optional_U_vowel() {
        lab0: {
            const v_1: number = this.limit - this.c;
            lab1: {
                if (!(this.in_grouping_b(g_U, 105, 305))) break lab1;
                const v_2: number = this.limit - this.c;
                if (!(this.out_grouping_b(g_vowel, 97, 305))) break lab1;
                this.c = this.limit - v_2;
                break lab0;
            }
            this.c = this.limit - v_1;
            lab2: {
                if (!(this.in_grouping_b(g_U, 105, 305))) break lab2;
                return false;
            }
            const v_3: number = this.limit - this.c;
            if (this.c <= this.limit_backward) return false;
            this.c--;
            if (!(this.out_grouping_b(g_vowel, 97, 305))) return false;
            this.c = this.limit - v_3;
        }
        return true;
    }
    #r_mark_possessives() {
        if (this.find_among_b(a_0) === 0) return false;
        return this.#r_mark_suffix_with_optional_U_vowel();
    }
    #r_mark_sU() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (!(this.in_grouping_b(g_U, 105, 305))) return false;
        return this.#r_mark_suffix_with_optional_s_consonant();
    }
    #r_mark_lArI() {
        return this.find_among_b(a_1) !== 0;
    }
    #r_mark_yU() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (!(this.in_grouping_b(g_U, 105, 305))) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_nU() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_2) !== 0;
    }
    #r_mark_nUn() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_3) === 0) return false;
        return this.#r_mark_suffix_with_optional_n_consonant();
    }
    #r_mark_yA() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_4) === 0) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_nA() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_5) !== 0;
    }
    #r_mark_DA() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_6) !== 0;
    }
    #r_mark_ndA() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_7) !== 0;
    }
    #r_mark_DAn() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_8) !== 0;
    }
    #r_mark_ndAn() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_9) !== 0;
    }
    #r_mark_ylA() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_10) === 0) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_ncA() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_11) === 0) return false;
        return this.#r_mark_suffix_with_optional_n_consonant();
    }
    #r_mark_yUm() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_12) === 0) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_sUn() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_13) !== 0;
    }
    #r_mark_yUz() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_14) === 0) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_sUnUz() {
        return this.find_among_b(a_15) !== 0;
    }
    #r_mark_lAr() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_16) !== 0;
    }
    #r_mark_nUz() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_17) !== 0;
    }
    #r_mark_DUr() {
        if (!this.#r_check_vowel_harmony()) return false;
        return this.find_among_b(a_18) !== 0;
    }
    #r_mark_cAsInA() {
        return this.find_among_b(a_19) !== 0;
    }
    #r_mark_yDU() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_20) === 0) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_ysA() {
        if (this.find_among_b(a_21) === 0) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_ymUs_() {
        if (!this.#r_check_vowel_harmony()) return false;
        if (this.find_among_b(a_22) === 0) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_mark_yken() {
        if (!(this.eq_s_b("ken"))) return false;
        return this.#r_mark_suffix_with_optional_y_consonant();
    }
    #r_stem_nominal_verb_suffixes() {
        this.ket = this.c;
        this.#B_continue_stemming_noun_suffixes = true;
        lab0: {
            const v_1: number = this.limit - this.c;
            lab1: {
                lab2: {
                    const v_2: number = this.limit - this.c;
                    lab3: {
                        if (!this.#r_mark_ymUs_()) break lab3;
                        break lab2;
                    }
                    this.c = this.limit - v_2;
                    lab4: {
                        if (!this.#r_mark_yDU()) break lab4;
                        break lab2;
                    }
                    this.c = this.limit - v_2;
                    lab5: {
                        if (!this.#r_mark_ysA()) break lab5;
                        break lab2;
                    }
                    this.c = this.limit - v_2;
                    if (!this.#r_mark_yken()) break lab1;
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab6: {
                if (!this.#r_mark_cAsInA()) break lab6;
                lab7: {
                    const v_3: number = this.limit - this.c;
                    lab8: {
                        if (!this.#r_mark_sUnUz()) break lab8;
                        break lab7;
                    }
                    this.c = this.limit - v_3;
                    lab9: {
                        if (!this.#r_mark_lAr()) break lab9;
                        break lab7;
                    }
                    this.c = this.limit - v_3;
                    lab10: {
                        if (!this.#r_mark_yUm()) break lab10;
                        break lab7;
                    }
                    this.c = this.limit - v_3;
                    lab11: {
                        if (!this.#r_mark_sUn()) break lab11;
                        break lab7;
                    }
                    this.c = this.limit - v_3;
                    lab12: {
                        if (!this.#r_mark_yUz()) break lab12;
                        break lab7;
                    }
                    this.c = this.limit - v_3;
                }
                if (!this.#r_mark_ymUs_()) break lab6;
                break lab0;
            }
            this.c = this.limit - v_1;
            lab13: {
                if (!this.#r_mark_lAr()) break lab13;
                this.bra = this.c;
                this.slice_del();
                const v_4: number = this.limit - this.c;
                lab14: {
                    this.ket = this.c;
                    lab15: {
                        const v_5: number = this.limit - this.c;
                        lab16: {
                            if (!this.#r_mark_DUr()) break lab16;
                            break lab15;
                        }
                        this.c = this.limit - v_5;
                        lab17: {
                            if (!this.#r_mark_yDU()) break lab17;
                            break lab15;
                        }
                        this.c = this.limit - v_5;
                        lab18: {
                            if (!this.#r_mark_ysA()) break lab18;
                            break lab15;
                        }
                        this.c = this.limit - v_5;
                        if (!this.#r_mark_ymUs_()) {
                            this.c = this.limit - v_4;
                            break lab14;
                        }
                    }
                }
                this.#B_continue_stemming_noun_suffixes = false;
                break lab0;
            }
            this.c = this.limit - v_1;
            lab19: {
                if (!this.#r_mark_nUz()) break lab19;
                lab20: {
                    const v_6: number = this.limit - this.c;
                    lab21: {
                        if (!this.#r_mark_yDU()) break lab21;
                        break lab20;
                    }
                    this.c = this.limit - v_6;
                    if (!this.#r_mark_ysA()) break lab19;
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab22: {
                lab23: {
                    const v_7: number = this.limit - this.c;
                    lab24: {
                        if (!this.#r_mark_sUnUz()) break lab24;
                        break lab23;
                    }
                    this.c = this.limit - v_7;
                    lab25: {
                        if (!this.#r_mark_yUz()) break lab25;
                        break lab23;
                    }
                    this.c = this.limit - v_7;
                    lab26: {
                        if (!this.#r_mark_sUn()) break lab26;
                        break lab23;
                    }
                    this.c = this.limit - v_7;
                    if (!this.#r_mark_yUm()) break lab22;
                }
                this.bra = this.c;
                this.slice_del();
                const v_8: number = this.limit - this.c;
                lab27: {
                    this.ket = this.c;
                    if (!this.#r_mark_ymUs_()) {
                        this.c = this.limit - v_8;
                        break lab27;
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            if (!this.#r_mark_DUr()) return false;
            this.bra = this.c;
            this.slice_del();
            const v_9: number = this.limit - this.c;
            lab28: {
                this.ket = this.c;
                lab29: {
                    const v_10: number = this.limit - this.c;
                    lab30: {
                        if (!this.#r_mark_sUnUz()) break lab30;
                        break lab29;
                    }
                    this.c = this.limit - v_10;
                    lab31: {
                        if (!this.#r_mark_lAr()) break lab31;
                        break lab29;
                    }
                    this.c = this.limit - v_10;
                    lab32: {
                        if (!this.#r_mark_yUm()) break lab32;
                        break lab29;
                    }
                    this.c = this.limit - v_10;
                    lab33: {
                        if (!this.#r_mark_sUn()) break lab33;
                        break lab29;
                    }
                    this.c = this.limit - v_10;
                    lab34: {
                        if (!this.#r_mark_yUz()) break lab34;
                        break lab29;
                    }
                    this.c = this.limit - v_10;
                }
                if (!this.#r_mark_ymUs_()) {
                    this.c = this.limit - v_9;
                    break lab28;
                }
            }
        }
        this.bra = this.c;
        this.slice_del();
        return true;
    }
    #r_stem_suffix_chain_before_ki() {
        this.ket = this.c;
        if (!(this.eq_s_b("ki"))) return false;
        lab0: {
            const v_1: number = this.limit - this.c;
            lab1: {
                if (!this.#r_mark_DA()) break lab1;
                this.bra = this.c;
                this.slice_del();
                const v_2: number = this.limit - this.c;
                lab2: {
                    this.ket = this.c;
                    lab3: {
                        const v_3: number = this.limit - this.c;
                        lab4: {
                            if (!this.#r_mark_lAr()) break lab4;
                            this.bra = this.c;
                            this.slice_del();
                            const v_4: number = this.limit - this.c;
                            lab5: {
                                if (!this.#r_stem_suffix_chain_before_ki()) {
                                    this.c = this.limit - v_4;
                                    break lab5;
                                }
                            }
                            break lab3;
                        }
                        this.c = this.limit - v_3;
                        if (!this.#r_mark_possessives()) {
                            this.c = this.limit - v_2;
                            break lab2;
                        }
                        this.bra = this.c;
                        this.slice_del();
                        const v_5: number = this.limit - this.c;
                        lab6: {
                            this.ket = this.c;
                            if (!this.#r_mark_lAr()) {
                                this.c = this.limit - v_5;
                                break lab6;
                            }
                            this.bra = this.c;
                            this.slice_del();
                            if (!this.#r_stem_suffix_chain_before_ki()) {
                                this.c = this.limit - v_5;
                                break lab6;
                            }
                        }
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab7: {
                if (!this.#r_mark_nUn()) break lab7;
                this.bra = this.c;
                this.slice_del();
                const v_6: number = this.limit - this.c;
                lab8: {
                    this.ket = this.c;
                    lab9: {
                        const v_7: number = this.limit - this.c;
                        lab10: {
                            if (!this.#r_mark_lArI()) break lab10;
                            this.bra = this.c;
                            this.slice_del();
                            break lab9;
                        }
                        this.c = this.limit - v_7;
                        lab11: {
                            this.ket = this.c;
                            lab12: {
                                const v_8: number = this.limit - this.c;
                                lab13: {
                                    if (!this.#r_mark_possessives()) break lab13;
                                    break lab12;
                                }
                                this.c = this.limit - v_8;
                                if (!this.#r_mark_sU()) break lab11;
                            }
                            this.bra = this.c;
                            this.slice_del();
                            const v_9: number = this.limit - this.c;
                            lab14: {
                                this.ket = this.c;
                                if (!this.#r_mark_lAr()) {
                                    this.c = this.limit - v_9;
                                    break lab14;
                                }
                                this.bra = this.c;
                                this.slice_del();
                                if (!this.#r_stem_suffix_chain_before_ki()) {
                                    this.c = this.limit - v_9;
                                    break lab14;
                                }
                            }
                            break lab9;
                        }
                        this.c = this.limit - v_7;
                        if (!this.#r_stem_suffix_chain_before_ki()) {
                            this.c = this.limit - v_6;
                            break lab8;
                        }
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            if (!this.#r_mark_ndA()) return false;
            lab15: {
                const v_10: number = this.limit - this.c;
                lab16: {
                    if (!this.#r_mark_lArI()) break lab16;
                    this.bra = this.c;
                    this.slice_del();
                    break lab15;
                }
                this.c = this.limit - v_10;
                lab17: {
                    if (!this.#r_mark_sU()) break lab17;
                    this.bra = this.c;
                    this.slice_del();
                    const v_11: number = this.limit - this.c;
                    lab18: {
                        this.ket = this.c;
                        if (!this.#r_mark_lAr()) {
                            this.c = this.limit - v_11;
                            break lab18;
                        }
                        this.bra = this.c;
                        this.slice_del();
                        if (!this.#r_stem_suffix_chain_before_ki()) {
                            this.c = this.limit - v_11;
                            break lab18;
                        }
                    }
                    break lab15;
                }
                this.c = this.limit - v_10;
                if (!this.#r_stem_suffix_chain_before_ki()) return false;
            }
        }
        return true;
    }
    #r_stem_noun_suffixes() {
        lab0: {
            const v_1: number = this.limit - this.c;
            lab1: {
                this.ket = this.c;
                if (!this.#r_mark_lAr()) break lab1;
                this.bra = this.c;
                this.slice_del();
                const v_2: number = this.limit - this.c;
                lab2: {
                    if (!this.#r_stem_suffix_chain_before_ki()) {
                        this.c = this.limit - v_2;
                        break lab2;
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab3: {
                this.ket = this.c;
                if (!this.#r_mark_ncA()) break lab3;
                this.bra = this.c;
                this.slice_del();
                const v_3: number = this.limit - this.c;
                lab4: {
                    lab5: {
                        const v_4: number = this.limit - this.c;
                        lab6: {
                            this.ket = this.c;
                            if (!this.#r_mark_lArI()) break lab6;
                            this.bra = this.c;
                            this.slice_del();
                            break lab5;
                        }
                        this.c = this.limit - v_4;
                        lab7: {
                            this.ket = this.c;
                            lab8: {
                                const v_5: number = this.limit - this.c;
                                lab9: {
                                    if (!this.#r_mark_possessives()) break lab9;
                                    break lab8;
                                }
                                this.c = this.limit - v_5;
                                if (!this.#r_mark_sU()) break lab7;
                            }
                            this.bra = this.c;
                            this.slice_del();
                            const v_6: number = this.limit - this.c;
                            lab10: {
                                this.ket = this.c;
                                if (!this.#r_mark_lAr()) {
                                    this.c = this.limit - v_6;
                                    break lab10;
                                }
                                this.bra = this.c;
                                this.slice_del();
                                if (!this.#r_stem_suffix_chain_before_ki()) {
                                    this.c = this.limit - v_6;
                                    break lab10;
                                }
                            }
                            break lab5;
                        }
                        this.c = this.limit - v_4;
                        this.ket = this.c;
                        if (!this.#r_mark_lAr()) {
                            this.c = this.limit - v_3;
                            break lab4;
                        }
                        this.bra = this.c;
                        this.slice_del();
                        if (!this.#r_stem_suffix_chain_before_ki()) {
                            this.c = this.limit - v_3;
                            break lab4;
                        }
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab11: {
                this.ket = this.c;
                lab12: {
                    const v_7: number = this.limit - this.c;
                    lab13: {
                        if (!this.#r_mark_ndA()) break lab13;
                        break lab12;
                    }
                    this.c = this.limit - v_7;
                    if (!this.#r_mark_nA()) break lab11;
                }
                lab14: {
                    const v_8: number = this.limit - this.c;
                    lab15: {
                        if (!this.#r_mark_lArI()) break lab15;
                        this.bra = this.c;
                        this.slice_del();
                        break lab14;
                    }
                    this.c = this.limit - v_8;
                    lab16: {
                        if (!this.#r_mark_sU()) break lab16;
                        this.bra = this.c;
                        this.slice_del();
                        const v_9: number = this.limit - this.c;
                        lab17: {
                            this.ket = this.c;
                            if (!this.#r_mark_lAr()) {
                                this.c = this.limit - v_9;
                                break lab17;
                            }
                            this.bra = this.c;
                            this.slice_del();
                            if (!this.#r_stem_suffix_chain_before_ki()) {
                                this.c = this.limit - v_9;
                                break lab17;
                            }
                        }
                        break lab14;
                    }
                    this.c = this.limit - v_8;
                    if (!this.#r_stem_suffix_chain_before_ki()) break lab11;
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab18: {
                this.ket = this.c;
                lab19: {
                    const v_10: number = this.limit - this.c;
                    lab20: {
                        if (!this.#r_mark_ndAn()) break lab20;
                        break lab19;
                    }
                    this.c = this.limit - v_10;
                    if (!this.#r_mark_nU()) break lab18;
                }
                lab21: {
                    const v_11: number = this.limit - this.c;
                    lab22: {
                        if (!this.#r_mark_sU()) break lab22;
                        this.bra = this.c;
                        this.slice_del();
                        const v_12: number = this.limit - this.c;
                        lab23: {
                            this.ket = this.c;
                            if (!this.#r_mark_lAr()) {
                                this.c = this.limit - v_12;
                                break lab23;
                            }
                            this.bra = this.c;
                            this.slice_del();
                            if (!this.#r_stem_suffix_chain_before_ki()) {
                                this.c = this.limit - v_12;
                                break lab23;
                            }
                        }
                        break lab21;
                    }
                    this.c = this.limit - v_11;
                    if (!this.#r_mark_lArI()) break lab18;
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab24: {
                this.ket = this.c;
                if (!this.#r_mark_DAn()) break lab24;
                this.bra = this.c;
                this.slice_del();
                const v_13: number = this.limit - this.c;
                lab25: {
                    this.ket = this.c;
                    lab26: {
                        const v_14: number = this.limit - this.c;
                        lab27: {
                            if (!this.#r_mark_possessives()) break lab27;
                            this.bra = this.c;
                            this.slice_del();
                            const v_15: number = this.limit - this.c;
                            lab28: {
                                this.ket = this.c;
                                if (!this.#r_mark_lAr()) {
                                    this.c = this.limit - v_15;
                                    break lab28;
                                }
                                this.bra = this.c;
                                this.slice_del();
                                if (!this.#r_stem_suffix_chain_before_ki()) {
                                    this.c = this.limit - v_15;
                                    break lab28;
                                }
                            }
                            break lab26;
                        }
                        this.c = this.limit - v_14;
                        lab29: {
                            if (!this.#r_mark_lAr()) break lab29;
                            this.bra = this.c;
                            this.slice_del();
                            const v_16: number = this.limit - this.c;
                            lab30: {
                                if (!this.#r_stem_suffix_chain_before_ki()) {
                                    this.c = this.limit - v_16;
                                    break lab30;
                                }
                            }
                            break lab26;
                        }
                        this.c = this.limit - v_14;
                        if (!this.#r_stem_suffix_chain_before_ki()) {
                            this.c = this.limit - v_13;
                            break lab25;
                        }
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab31: {
                this.ket = this.c;
                lab32: {
                    const v_17: number = this.limit - this.c;
                    lab33: {
                        if (!this.#r_mark_nUn()) break lab33;
                        break lab32;
                    }
                    this.c = this.limit - v_17;
                    if (!this.#r_mark_ylA()) break lab31;
                }
                this.bra = this.c;
                this.slice_del();
                const v_18: number = this.limit - this.c;
                lab34: {
                    lab35: {
                        const v_19: number = this.limit - this.c;
                        lab36: {
                            this.ket = this.c;
                            if (!this.#r_mark_lAr()) break lab36;
                            this.bra = this.c;
                            this.slice_del();
                            if (!this.#r_stem_suffix_chain_before_ki()) break lab36;
                            break lab35;
                        }
                        this.c = this.limit - v_19;
                        lab37: {
                            this.ket = this.c;
                            lab38: {
                                const v_20: number = this.limit - this.c;
                                lab39: {
                                    if (!this.#r_mark_possessives()) break lab39;
                                    break lab38;
                                }
                                this.c = this.limit - v_20;
                                if (!this.#r_mark_sU()) break lab37;
                            }
                            this.bra = this.c;
                            this.slice_del();
                            const v_21: number = this.limit - this.c;
                            lab40: {
                                this.ket = this.c;
                                if (!this.#r_mark_lAr()) {
                                    this.c = this.limit - v_21;
                                    break lab40;
                                }
                                this.bra = this.c;
                                this.slice_del();
                                if (!this.#r_stem_suffix_chain_before_ki()) {
                                    this.c = this.limit - v_21;
                                    break lab40;
                                }
                            }
                            break lab35;
                        }
                        this.c = this.limit - v_19;
                        if (!this.#r_stem_suffix_chain_before_ki()) {
                            this.c = this.limit - v_18;
                            break lab34;
                        }
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            lab41: {
                this.ket = this.c;
                if (!this.#r_mark_lArI()) break lab41;
                this.bra = this.c;
                this.slice_del();
                break lab0;
            }
            this.c = this.limit - v_1;
            lab42: {
                if (!this.#r_stem_suffix_chain_before_ki()) break lab42;
                break lab0;
            }
            this.c = this.limit - v_1;
            lab43: {
                this.ket = this.c;
                lab44: {
                    const v_22: number = this.limit - this.c;
                    lab45: {
                        if (!this.#r_mark_DA()) break lab45;
                        break lab44;
                    }
                    this.c = this.limit - v_22;
                    lab46: {
                        if (!this.#r_mark_yU()) break lab46;
                        break lab44;
                    }
                    this.c = this.limit - v_22;
                    if (!this.#r_mark_yA()) break lab43;
                }
                this.bra = this.c;
                this.slice_del();
                const v_23: number = this.limit - this.c;
                lab47: {
                    this.ket = this.c;
                    lab48: {
                        const v_24: number = this.limit - this.c;
                        lab49: {
                            if (!this.#r_mark_possessives()) break lab49;
                            this.bra = this.c;
                            this.slice_del();
                            const v_25: number = this.limit - this.c;
                            lab50: {
                                this.ket = this.c;
                                if (!this.#r_mark_lAr()) {
                                    this.c = this.limit - v_25;
                                    break lab50;
                                }
                            }
                            break lab48;
                        }
                        this.c = this.limit - v_24;
                        if (!this.#r_mark_lAr()) {
                            this.c = this.limit - v_23;
                            break lab47;
                        }
                    }
                    this.bra = this.c;
                    this.slice_del();
                    this.ket = this.c;
                    if (!this.#r_stem_suffix_chain_before_ki()) {
                        this.c = this.limit - v_23;
                        break lab47;
                    }
                }
                break lab0;
            }
            this.c = this.limit - v_1;
            this.ket = this.c;
            lab51: {
                const v_26: number = this.limit - this.c;
                lab52: {
                    if (!this.#r_mark_possessives()) break lab52;
                    break lab51;
                }
                this.c = this.limit - v_26;
                if (!this.#r_mark_sU()) return false;
            }
            this.bra = this.c;
            this.slice_del();
            const v_27: number = this.limit - this.c;
            lab53: {
                this.ket = this.c;
                if (!this.#r_mark_lAr()) {
                    this.c = this.limit - v_27;
                    break lab53;
                }
                this.bra = this.c;
                this.slice_del();
                if (!this.#r_stem_suffix_chain_before_ki()) {
                    this.c = this.limit - v_27;
                    break lab53;
                }
            }
        }
        return true;
    }
    #r_post_process_last_consonants() {
        let a: number;
        this.ket = this.c;
        a = this.find_among_b(a_23);
        if (a === 0) return false;
        this.bra = this.c;
        this.slice_from(as_23[a - 1]);
        return true;
    }
    #r_append_U_to_stems_ending_with_d_or_g() {
        this.ket = this.c;
        this.bra = this.c;
        lab0: {
            lab1: {
                if (!(this.eq_s_b("d"))) break lab1;
                break lab0;
            }
            if (!(this.eq_s_b("g"))) return false;
        }
        if (!this.go_out_grouping_b(g_vowel, 97, 305)) return false;
        lab2: {
            const v_1: number = this.limit - this.c;
            lab3: {
                lab4: {
                    lab5: {
                        if (!(this.eq_s_b("a"))) break lab5;
                        break lab4;
                    }
                    if (!(this.eq_s_b("\u0131"))) break lab3;
                }
                this.slice_from("\u0131");
                break lab2;
            }
            this.c = this.limit - v_1;
            lab6: {
                lab7: {
                    lab8: {
                        if (!(this.eq_s_b("e"))) break lab8;
                        break lab7;
                    }
                    if (!(this.eq_s_b("i"))) break lab6;
                }
                this.slice_from("i");
                break lab2;
            }
            this.c = this.limit - v_1;
            lab9: {
                lab10: {
                    lab11: {
                        if (!(this.eq_s_b("o"))) break lab11;
                        break lab10;
                    }
                    if (!(this.eq_s_b("u"))) break lab9;
                }
                this.slice_from("u");
                break lab2;
            }
            this.c = this.limit - v_1;
            lab12: {
                lab13: {
                    if (!(this.eq_s_b("\u00F6"))) break lab13;
                    break lab12;
                }
                if (!(this.eq_s_b("\u00FC"))) return false;
            }
            this.slice_from("\u00FC");
        }
        return true;
    }
    #r_is_reserved_word() {
        if (!(this.eq_s_b("ad"))) return false;
        const v_1: number = this.limit - this.c;
        lab0: {
            if (!(this.eq_s_b("soy"))) {
                this.c = this.limit - v_1;
                break lab0;
            }
        }
        return this.c <= this.limit_backward;
    }
    #r_remove_proper_noun_suffix() {
        const v_1: number = this.c;
        lab0: {
            this.bra = this.c;
            golab1: while (true)
            {
                const v_2: number = this.c;
                lab2: {
                    lab3: {
                        if (!(this.eq_s("'"))) break lab3;
                        break lab2;
                    }
                    this.c = v_2;
                    break golab1;
                }
                this.c = v_2;
                if (this.c >= this.limit) break lab0;
                this.c++;
            }
            this.ket = this.c;
            this.slice_del();
        }
        this.c = v_1;
        const v_3: number = this.c;
        lab4: {
            if (this.c + 2 > this.limit) break lab4;
            this.c += 2;
            golab5: while (true)
            {
                const v_4: number = this.c;
                lab6: {
                    if (!(this.eq_s("'"))) break lab6;
                    this.c = v_4;
                    break golab5;
                }
                this.c = v_4;
                if (this.c >= this.limit) break lab4;
                this.c++;
            }
            this.bra = this.c;
            this.c = this.limit;
            this.ket = this.c;
            this.slice_del();
        }
        this.c = v_3;
        return true;
    }
    #r_more_than_one_syllable_word() {
        const v_1: number = this.c;
        for (let v_2: number = 2; v_2 > 0; v_2--)
        {
            if (!this.go_out_grouping(g_vowel, 97, 305)) return false;
            this.c++;
        }
        this.c = v_1;
        return true;
    }
    #r_postlude() {
        this.limit_backward = this.c; this.c = this.limit;
        {
            const v_1: number = this.limit - this.c;
            lab0: {
                if (!this.#r_is_reserved_word()) break lab0;
                return false;
            }
            this.c = this.limit - v_1;
        }
        const v_2: number = this.limit - this.c;
        this.#r_append_U_to_stems_ending_with_d_or_g();
        this.c = this.limit - v_2;
        const v_3: number = this.limit - this.c;
        this.#r_post_process_last_consonants();
        this.c = this.limit - v_3;
        this.c = this.limit_backward;
        return true;
    }
    #stem() {
        this.#r_remove_proper_noun_suffix();
        if (!this.#r_more_than_one_syllable_word()) return false;
        this.limit_backward = this.c; this.c = this.limit;
        const v_1: number = this.limit - this.c;
        this.#r_stem_nominal_verb_suffixes();
        this.c = this.limit - v_1;
        if (!this.#B_continue_stemming_noun_suffixes) return false;
        const v_2: number = this.limit - this.c;
        this.#r_stem_noun_suffixes();
        this.c = this.limit - v_2;
        this.c = this.limit_backward;
        return this.#r_postlude();
    }

        stem(input: string): string {
        this.setCurrent(input);
        this.#stem();
        return this.getCurrent();
    }
}

const stemmer = new TurkishStemmer();

/** Turkish Snowball stem of a lowercase word. */
export const stem_tr = (word: string): string => stemmer.stem(word);
