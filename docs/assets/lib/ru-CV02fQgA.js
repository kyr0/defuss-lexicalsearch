import { S as SnowballStemmer } from './snowball-COqm-oKm.js';

const a_0 = [
  ["\u0432", 1],
  ["\u0438\u0432", 2, 1],
  ["\u044B\u0432", 2, 2],
  ["\u0432\u0448\u0438", 1],
  ["\u0438\u0432\u0448\u0438", 2, 1],
  ["\u044B\u0432\u0448\u0438", 2, 2],
  ["\u0432\u0448\u0438\u0441\u044C", 1],
  ["\u0438\u0432\u0448\u0438\u0441\u044C", 2, 1],
  ["\u044B\u0432\u0448\u0438\u0441\u044C", 2, 2]
];
const a_1 = [
  ["\u0435\u0435", 1],
  ["\u0438\u0435", 1],
  ["\u043E\u0435", 1],
  ["\u044B\u0435", 1],
  ["\u0438\u043C\u0438", 1],
  ["\u044B\u043C\u0438", 1],
  ["\u0435\u0439", 1],
  ["\u0438\u0439", 1],
  ["\u043E\u0439", 1],
  ["\u044B\u0439", 1],
  ["\u0435\u043C", 1],
  ["\u0438\u043C", 1],
  ["\u043E\u043C", 1],
  ["\u044B\u043C", 1],
  ["\u0435\u0433\u043E", 1],
  ["\u043E\u0433\u043E", 1],
  ["\u0435\u043C\u0443", 1],
  ["\u043E\u043C\u0443", 1],
  ["\u0438\u0445", 1],
  ["\u044B\u0445", 1],
  ["\u0435\u044E", 1],
  ["\u043E\u044E", 1],
  ["\u0443\u044E", 1],
  ["\u044E\u044E", 1],
  ["\u0430\u044F", 1],
  ["\u044F\u044F", 1]
];
const a_2 = [
  ["\u0435\u043C", 1],
  ["\u043D\u043D", 1],
  ["\u0432\u0448", 1],
  ["\u0438\u0432\u0448", 2, 1],
  ["\u044B\u0432\u0448", 2, 2],
  ["\u0449", 1],
  ["\u044E\u0449", 1, 1],
  ["\u0443\u044E\u0449", 2, 1]
];
const a_3 = [
  ["\u0441\u044C", 1],
  ["\u0441\u044F", 1]
];
const a_4 = [
  ["\u043B\u0430", 1],
  ["\u0438\u043B\u0430", 2, 1],
  ["\u044B\u043B\u0430", 2, 2],
  ["\u043D\u0430", 1],
  ["\u0435\u043D\u0430", 2, 1],
  ["\u0435\u0442\u0435", 1],
  ["\u0438\u0442\u0435", 2],
  ["\u0439\u0442\u0435", 1],
  ["\u0435\u0439\u0442\u0435", 2, 1],
  ["\u0443\u0439\u0442\u0435", 2, 2],
  ["\u043B\u0438", 1],
  ["\u0438\u043B\u0438", 2, 1],
  ["\u044B\u043B\u0438", 2, 2],
  ["\u0439", 1],
  ["\u0435\u0439", 2, 1],
  ["\u0443\u0439", 2, 2],
  ["\u043B", 1],
  ["\u0438\u043B", 2, 1],
  ["\u044B\u043B", 2, 2],
  ["\u0435\u043C", 1],
  ["\u0438\u043C", 2],
  ["\u044B\u043C", 2],
  ["\u043D", 1],
  ["\u0435\u043D", 2, 1],
  ["\u043B\u043E", 1],
  ["\u0438\u043B\u043E", 2, 1],
  ["\u044B\u043B\u043E", 2, 2],
  ["\u043D\u043E", 1],
  ["\u0435\u043D\u043E", 2, 1],
  ["\u043D\u043D\u043E", 1, 2],
  ["\u0435\u0442", 1],
  ["\u0443\u0435\u0442", 2, 1],
  ["\u0438\u0442", 2],
  ["\u044B\u0442", 2],
  ["\u044E\u0442", 1],
  ["\u0443\u044E\u0442", 2, 1],
  ["\u044F\u0442", 2],
  ["\u043D\u044B", 1],
  ["\u0435\u043D\u044B", 2, 1],
  ["\u0442\u044C", 1],
  ["\u0438\u0442\u044C", 2, 1],
  ["\u044B\u0442\u044C", 2, 2],
  ["\u0435\u0448\u044C", 1],
  ["\u0438\u0448\u044C", 2],
  ["\u044E", 2],
  ["\u0443\u044E", 2, 1]
];
const a_5 = [
  ["\u0430", 1],
  ["\u0435\u0432", 1],
  ["\u043E\u0432", 1],
  ["\u0435", 1],
  ["\u0438\u0435", 1, 1],
  ["\u044C\u0435", 1, 2],
  ["\u0438", 1],
  ["\u0435\u0438", 1, 1],
  ["\u0438\u0438", 1, 2],
  ["\u0430\u043C\u0438", 1, 3],
  ["\u044F\u043C\u0438", 1, 4],
  ["\u0438\u044F\u043C\u0438", 1, 1],
  ["\u0439", 1],
  ["\u0435\u0439", 1, 1],
  ["\u0438\u0435\u0439", 1, 1],
  ["\u0438\u0439", 1, 3],
  ["\u043E\u0439", 1, 4],
  ["\u0430\u043C", 1],
  ["\u0435\u043C", 1],
  ["\u0438\u0435\u043C", 1, 1],
  ["\u043E\u043C", 1],
  ["\u044F\u043C", 1],
  ["\u0438\u044F\u043C", 1, 1],
  ["\u043E", 1],
  ["\u0443", 1],
  ["\u0430\u0445", 1],
  ["\u044F\u0445", 1],
  ["\u0438\u044F\u0445", 1, 1],
  ["\u044B", 1],
  ["\u044C", 1],
  ["\u044E", 1],
  ["\u0438\u044E", 1, 1],
  ["\u044C\u044E", 1, 2],
  ["\u044F", 1],
  ["\u0438\u044F", 1, 1],
  ["\u044C\u044F", 1, 2]
];
const a_6 = [
  ["\u043E\u0441\u0442", 1],
  ["\u043E\u0441\u0442\u044C", 1]
];
const a_7 = [
  ["\u0435\u0439\u0448\u0435", 1],
  ["\u043D", 2],
  ["\u0435\u0439\u0448", 1],
  ["\u044C", 3]
];
const g_v = [33, 65, 8, 232];
class RussianStemmer extends SnowballStemmer {
  #I_p2 = 0;
  #I_pV = 0;
  #r_mark_regions() {
    this.#I_pV = this.limit;
    this.#I_p2 = this.limit;
    const v_1 = this.c;
    lab0: {
      if (!this.go_out_grouping(g_v, 1072, 1103)) break lab0;
      this.c++;
      this.#I_pV = this.c;
      if (!this.go_in_grouping(g_v, 1072, 1103)) break lab0;
      this.c++;
      if (!this.go_out_grouping(g_v, 1072, 1103)) break lab0;
      this.c++;
      if (!this.go_in_grouping(g_v, 1072, 1103)) break lab0;
      this.c++;
      this.#I_p2 = this.c;
    }
    this.c = v_1;
    return true;
  }
  #r_perfective_gerund() {
    let a;
    this.ket = this.c;
    a = this.find_among_b(a_0);
    if (a === 0) return false;
    this.bra = this.c;
    switch (a) {
      case 1: {
        lab0: {
          lab1: {
            if (!this.eq_s_b("\u0430")) break lab1;
            break lab0;
          }
          if (!this.eq_s_b("\u044F")) return false;
        }
        this.slice_del();
        break;
      }
      case 2: {
        this.slice_del();
        break;
      }
    }
    return true;
  }
  #r_adjective() {
    this.ket = this.c;
    if (this.find_among_b(a_1) === 0) return false;
    this.bra = this.c;
    this.slice_del();
    return true;
  }
  #r_adjectival() {
    let a;
    if (!this.#r_adjective()) return false;
    const v_1 = this.limit - this.c;
    lab0: {
      this.ket = this.c;
      a = this.find_among_b(a_2);
      if (a === 0) {
        this.c = this.limit - v_1;
        break lab0;
      }
      this.bra = this.c;
      switch (a) {
        case 1: {
          lab1: {
            lab2: {
              if (!this.eq_s_b("\u0430")) break lab2;
              break lab1;
            }
            if (!this.eq_s_b("\u044F")) {
              this.c = this.limit - v_1;
              break lab0;
            }
          }
          this.slice_del();
          break;
        }
        case 2: {
          this.slice_del();
          break;
        }
      }
    }
    return true;
  }
  #r_reflexive() {
    this.ket = this.c;
    if (this.find_among_b(a_3) === 0) return false;
    this.bra = this.c;
    this.slice_del();
    return true;
  }
  #r_verb() {
    let a;
    this.ket = this.c;
    a = this.find_among_b(a_4);
    if (a === 0) return false;
    this.bra = this.c;
    switch (a) {
      case 1: {
        lab0: {
          lab1: {
            if (!this.eq_s_b("\u0430")) break lab1;
            break lab0;
          }
          if (!this.eq_s_b("\u044F")) return false;
        }
        this.slice_del();
        break;
      }
      case 2: {
        this.slice_del();
        break;
      }
    }
    return true;
  }
  #r_noun() {
    this.ket = this.c;
    if (this.find_among_b(a_5) === 0) return false;
    this.bra = this.c;
    this.slice_del();
    return true;
  }
  #r_derivational() {
    this.ket = this.c;
    if (this.find_among_b(a_6) === 0) return false;
    this.bra = this.c;
    if (this.#I_p2 > this.c) return false;
    this.slice_del();
    return true;
  }
  #r_tidy_up() {
    let a;
    this.ket = this.c;
    a = this.find_among_b(a_7);
    if (a === 0) return false;
    this.bra = this.c;
    switch (a) {
      case 1: {
        this.slice_del();
        this.ket = this.c;
        if (!this.eq_s_b("\u043D")) return false;
        this.bra = this.c;
        if (!this.eq_s_b("\u043D")) return false;
        this.slice_del();
        break;
      }
      case 2: {
        if (!this.eq_s_b("\u043D")) return false;
        this.slice_del();
        break;
      }
      case 3: {
        this.slice_del();
        break;
      }
    }
    return true;
  }
  #stem() {
    const v_1 = this.c;
    {
      while (true) {
        const v_2 = this.c;
        lab1: {
          golab2: while (true) {
            const v_3 = this.c;
            lab3: {
              this.bra = this.c;
              if (!this.eq_s("\u0451")) break lab3;
              this.ket = this.c;
              this.c = v_3;
              break golab2;
            }
            this.c = v_3;
            if (this.c >= this.limit) break lab1;
            this.c++;
          }
          this.slice_from("\u0435");
          continue;
        }
        this.c = v_2;
        break;
      }
    }
    this.c = v_1;
    this.#r_mark_regions();
    this.limit_backward = this.c;
    this.c = this.limit;
    if (this.c < this.#I_pV) return false;
    const v_4 = this.limit_backward;
    this.limit_backward = this.#I_pV;
    const v_5 = this.limit - this.c;
    lab4: {
      lab5: {
        const v_6 = this.limit - this.c;
        lab6: {
          if (!this.#r_perfective_gerund()) break lab6;
          break lab5;
        }
        this.c = this.limit - v_6;
        const v_7 = this.limit - this.c;
        lab7: {
          if (!this.#r_reflexive()) {
            this.c = this.limit - v_7;
            break lab7;
          }
        }
        lab8: {
          const v_8 = this.limit - this.c;
          lab9: {
            if (!this.#r_adjectival()) break lab9;
            break lab8;
          }
          this.c = this.limit - v_8;
          lab10: {
            if (!this.#r_verb()) break lab10;
            break lab8;
          }
          this.c = this.limit - v_8;
          if (!this.#r_noun()) break lab4;
        }
      }
    }
    this.c = this.limit - v_5;
    const v_9 = this.limit - this.c;
    lab11: {
      this.ket = this.c;
      if (!this.eq_s_b("\u0438")) {
        this.c = this.limit - v_9;
        break lab11;
      }
      this.bra = this.c;
      this.slice_del();
    }
    const v_10 = this.limit - this.c;
    this.#r_derivational();
    this.c = this.limit - v_10;
    const v_11 = this.limit - this.c;
    this.#r_tidy_up();
    this.c = this.limit - v_11;
    this.limit_backward = v_4;
    this.c = this.limit_backward;
    return true;
  }
  stem(input) {
    this.setCurrent(input);
    this.#stem();
    return this.getCurrent();
  }
}
const stemmer = new RussianStemmer();
const stem_ru = (word) => stemmer.stem(word);

export { stem_ru as s };
