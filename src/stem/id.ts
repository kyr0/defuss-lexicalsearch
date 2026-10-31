// Generated from indonesian.sbl by Snowball 3.1.1 (https://snowballstem.org/) with scripts/snowball.mjs; do not edit.
// BSD-3-Clause, Copyright (c) 2001 Dr Martin Porter, (c) 2004,2005 Richard Boulton, (c) 2013 Yoshiki Shibukawa,
// (c) 2006-2025 Olly Betts; the full license text is in snowball.ts.
// VERIFIED: reproduces the output.txt of snowball-data (commit 019921c) for every word of its voc.txt;
// test/languages.test.mjs keeps samples.
// oxlint-disable no-unused-labels
import { SnowballStemmer, type Among } from './snowball';

const a_0: readonly Among[] = [
    ["kah", 1],
    ["lah", 1],
    ["pun", 1]
];

const a_1: readonly Among[] = [
    ["nya", 1],
    ["ku", 1],
    ["mu", 1]
];

const a_2: readonly Among[] = [
    ["i", 2],
    ["an", 1]
];

const a_3: readonly Among[] = [
    ["di", 1],
    ["ke", 3],
    ["me", 1],
    ["mem", 5, 1],
    ["men", 2, 2],
    ["meng", 1, 1],
    ["pem", 6],
    ["pen", 4],
    ["peng", 3, 1],
    ["ter", 1]
];

const a_4: readonly Among[] = [
    ["be", 2],
    ["pe", 1]
];

const g_vowel: readonly number[] = [17, 65, 16];


class IndonesianStemmer extends SnowballStemmer {

    #I_prefix: number = 0;
    #I_measure: number = 0;
    #r_remove_particle() {
        this.ket = this.c;
        if (this.find_among_b(a_0) === 0) return false;
        this.bra = this.c;
        this.slice_del();
        --this.#I_measure;
        return true;
    }
    #r_remove_possessive_pronoun() {
        this.ket = this.c;
        if (this.find_among_b(a_1) === 0) return false;
        this.bra = this.c;
        this.slice_del();
        --this.#I_measure;
        return true;
    }
    #r_remove_suffix() {
        let a: number;
        this.ket = this.c;
        a = this.find_among_b(a_2);
        if (a === 0) return false;
        this.bra = this.c;
        switch (a) {
            case 1: {
                lab0: {
                    const v_1: number = this.limit - this.c;
                    lab1: {
                        if (this.#I_prefix === 3) break lab1;
                        if (this.#I_prefix === 2) break lab1;
                        if (!(this.eq_s_b("k"))) break lab1;
                        this.bra = this.c;
                        break lab0;
                    }
                    this.c = this.limit - v_1;
                    if (this.#I_prefix === 1) return false;
                }
                break;
            }
            case 2: {
                if (this.#I_prefix > 2) return false;
                lab2: {
                    if (!(this.eq_s_b("s"))) break lab2;
                    return false;
                }
                break;
            }
        }
        this.slice_del();
        --this.#I_measure;
        return true;
    }
    #r_remove_first_order_prefix() {
        let a: number;
        this.bra = this.c;
        a = this.find_among(a_3);
        if (a === 0) return false;
        this.ket = this.c;
        switch (a) {
            case 1: {
                this.slice_del();
                this.#I_prefix = 1;
                --this.#I_measure;
                break;
            }
            case 2: {
                lab0: {
                    const v_1: number = this.c;
                    lab1: {
                        if (!(this.eq_s("y"))) break lab1;
                        const v_2: number = this.c;
                        if (!(this.in_grouping(g_vowel, 97, 117))) break lab1;
                        this.c = v_2;
                        this.ket = this.c;
                        this.slice_from("s");
                        this.#I_prefix = 1;
                        --this.#I_measure;
                        break lab0;
                    }
                    this.c = v_1;
                    this.slice_del();
                    this.#I_prefix = 1;
                    --this.#I_measure;
                }
                break;
            }
            case 3: {
                this.slice_del();
                this.#I_prefix = 3;
                --this.#I_measure;
                break;
            }
            case 4: {
                lab2: {
                    const v_3: number = this.c;
                    lab3: {
                        if (!(this.eq_s("y"))) break lab3;
                        const v_4: number = this.c;
                        if (!(this.in_grouping(g_vowel, 97, 117))) break lab3;
                        this.c = v_4;
                        this.ket = this.c;
                        this.slice_from("s");
                        this.#I_prefix = 3;
                        --this.#I_measure;
                        break lab2;
                    }
                    this.c = v_3;
                    this.slice_del();
                    this.#I_prefix = 3;
                    --this.#I_measure;
                }
                break;
            }
            case 5: {
                this.#I_prefix = 1;
                --this.#I_measure;
                lab4: {
                    const v_5: number = this.c;
                    lab5: {
                        const v_6: number = this.c;
                        if (!(this.in_grouping(g_vowel, 97, 117))) break lab5;
                        this.c = v_6;
                        this.slice_from("p");
                        break lab4;
                    }
                    this.c = v_5;
                    this.slice_del();
                }
                break;
            }
            case 6: {
                this.#I_prefix = 3;
                --this.#I_measure;
                lab6: {
                    const v_7: number = this.c;
                    lab7: {
                        const v_8: number = this.c;
                        if (!(this.in_grouping(g_vowel, 97, 117))) break lab7;
                        this.c = v_8;
                        this.slice_from("p");
                        break lab6;
                    }
                    this.c = v_7;
                    this.slice_del();
                }
                break;
            }
        }
        return true;
    }
    #r_remove_second_order_prefix() {
        let a: number;
        this.bra = this.c;
        a = this.find_among(a_4);
        if (a === 0) return false;
        switch (a) {
            case 1: {
                lab0: {
                    const v_1: number = this.c;
                    lab1: {
                        if (!(this.eq_s("r"))) break lab1;
                        this.ket = this.c;
                        this.#I_prefix = 2;
                        break lab0;
                    }
                    this.c = v_1;
                    lab2: {
                        if (!(this.eq_s("l"))) break lab2;
                        this.ket = this.c;
                        if (!(this.eq_s("ajar"))) break lab2;
                        break lab0;
                    }
                    this.c = v_1;
                    this.ket = this.c;
                    this.#I_prefix = 2;
                }
                break;
            }
            case 2: {
                lab3: {
                    const v_2: number = this.c;
                    lab4: {
                        if (!(this.eq_s("r"))) break lab4;
                        this.ket = this.c;
                        break lab3;
                    }
                    this.c = v_2;
                    lab5: {
                        if (!(this.eq_s("l"))) break lab5;
                        this.ket = this.c;
                        if (!(this.eq_s("ajar"))) break lab5;
                        break lab3;
                    }
                    this.c = v_2;
                    this.ket = this.c;
                    if (!(this.out_grouping(g_vowel, 97, 117))) return false;
                    if (!(this.eq_s("er"))) return false;
                }
                this.#I_prefix = 4;
                break;
            }
        }
        --this.#I_measure;
        this.slice_del();
        return true;
    }
    #stem() {
        this.#I_measure = 0;
        const v_1: number = this.c;
        lab0: {
            while (true) {
                const v_2: number = this.c;
                lab1: {
                    if (!this.go_out_grouping(g_vowel, 97, 117)) break lab1;
                    this.c++;
                    ++this.#I_measure;
                    continue;
                }
                this.c = v_2;
                break;
            }
        }
        this.c = v_1;
        if (this.#I_measure <= 2) return false;
        this.#I_prefix = 0;
        this.limit_backward = this.c; this.c = this.limit;
        const v_3: number = this.limit - this.c;
        this.#r_remove_particle();
        this.c = this.limit - v_3;
        if (this.#I_measure <= 2) return false;
        const v_4: number = this.limit - this.c;
        this.#r_remove_possessive_pronoun();
        this.c = this.limit - v_4;
        this.c = this.limit_backward;
        if (this.#I_measure <= 2) return false;
        lab2: {
            const v_5: number = this.c;
            lab3: {
                const v_6: number = this.c;
                if (!this.#r_remove_first_order_prefix()) break lab3;
                const v_7: number = this.c;
                lab4: {
                    const v_8: number = this.c;
                    if (this.#I_measure <= 2) break lab4;
                    this.limit_backward = this.c; this.c = this.limit;
                    if (!this.#r_remove_suffix()) break lab4;
                    this.c = this.limit_backward;
                    this.c = v_8;
                    if (this.#I_measure <= 2) break lab4;
                    if (!this.#r_remove_second_order_prefix()) break lab4;
                }
                this.c = v_7;
                this.c = v_6;
                break lab2;
            }
            this.c = v_5;
            const v_9: number = this.c;
            this.#r_remove_second_order_prefix();
            this.c = v_9;
            const v_10: number = this.c;
            lab5: {
                if (this.#I_measure <= 2) break lab5;
                this.limit_backward = this.c; this.c = this.limit;
                if (!this.#r_remove_suffix()) break lab5;
                this.c = this.limit_backward;
            }
            this.c = v_10;
        }
        return true;
    }

        stem(input: string): string {
        this.setCurrent(input);
        this.#stem();
        return this.getCurrent();
    }
}

const stemmer = new IndonesianStemmer();

/** Indonesian Snowball stem of a lowercase word. */
export const stem_id = (word: string): string => stemmer.stem(word);
