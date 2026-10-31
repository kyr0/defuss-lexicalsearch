import { S as SnowballStemmer } from './snowball-COqm-oKm.js';

const a_0 = [
  ["", 3],
  ["\xE3", 1, 1],
  ["\xF5", 2, 2]
];
const a_1 = [
  ["", 3],
  ["a~", 1, 1],
  ["o~", 2, 2]
];
const a_2 = [
  ["ic", -1],
  ["ad", -1],
  ["os", -1],
  ["iv", 1]
];
const a_3 = [
  ["ante", 1],
  ["avel", 1],
  ["\xEDvel", 1]
];
const a_4 = [
  ["ic", 1],
  ["abil", 1],
  ["iv", 1]
];
const a_5 = [
  ["ica", 1],
  ["\xE2ncia", 1],
  ["\xEAncia", 4],
  ["logia", 2],
  ["ira", 9],
  ["adora", 1],
  ["osa", 1],
  ["ista", 1],
  ["iva", 8],
  ["eza", 1],
  ["idade", 7],
  ["ante", 1],
  ["mente", 6],
  ["amente", 5, 1],
  ["\xE1vel", 1],
  ["\xEDvel", 1],
  ["ico", 1],
  ["ismo", 1],
  ["oso", 1],
  ["amento", 1],
  ["imento", 1],
  ["ivo", 8],
  ["a\xE7a~o", 1],
  ["u\xE7a~o", 3],
  ["ador", 1],
  ["icas", 1],
  ["\xEAncias", 4],
  ["logias", 2],
  ["iras", 9],
  ["adoras", 1],
  ["osas", 1],
  ["istas", 1],
  ["ivas", 8],
  ["ezas", 1],
  ["idades", 7],
  ["adores", 1],
  ["antes", 1],
  ["a\xE7o~es", 1],
  ["u\xE7o~es", 3],
  ["icos", 1],
  ["ismos", 1],
  ["osos", 1],
  ["amentos", 1],
  ["imentos", 1],
  ["ivos", 8]
];
const a_6 = [
  ["ada", 1],
  ["ida", 1],
  ["ia", 1],
  ["aria", 1, 1],
  ["eria", 1, 2],
  ["iria", 1, 3],
  ["ara", 1],
  ["era", 1],
  ["ira", 1],
  ["ava", 1],
  ["asse", 1],
  ["esse", 1],
  ["isse", 1],
  ["aste", 1],
  ["este", 1],
  ["iste", 1],
  ["ei", 1],
  ["arei", 1, 1],
  ["erei", 1, 2],
  ["irei", 1, 3],
  ["am", 1],
  ["iam", 1, 1],
  ["ariam", 1, 1],
  ["eriam", 1, 2],
  ["iriam", 1, 3],
  ["aram", 1, 5],
  ["eram", 1, 6],
  ["iram", 1, 7],
  ["avam", 1, 8],
  ["em", 1],
  ["arem", 1, 1],
  ["erem", 1, 2],
  ["irem", 1, 3],
  ["assem", 1, 4],
  ["essem", 1, 5],
  ["issem", 1, 6],
  ["ado", 1],
  ["ido", 1],
  ["ando", 1],
  ["endo", 1],
  ["indo", 1],
  ["ara~o", 1],
  ["era~o", 1],
  ["ira~o", 1],
  ["ar", 1],
  ["er", 1],
  ["ir", 1],
  ["as", 1],
  ["adas", 1, 1],
  ["idas", 1, 2],
  ["ias", 1, 3],
  ["arias", 1, 1],
  ["erias", 1, 2],
  ["irias", 1, 3],
  ["aras", 1, 7],
  ["eras", 1, 8],
  ["iras", 1, 9],
  ["avas", 1, 10],
  ["es", 1],
  ["ardes", 1, 1],
  ["erdes", 1, 2],
  ["irdes", 1, 3],
  ["ares", 1, 4],
  ["eres", 1, 5],
  ["ires", 1, 6],
  ["asses", 1, 7],
  ["esses", 1, 8],
  ["isses", 1, 9],
  ["astes", 1, 10],
  ["estes", 1, 11],
  ["istes", 1, 12],
  ["is", 1],
  ["ais", 1, 1],
  ["eis", 1, 2],
  ["areis", 1, 1],
  ["ereis", 1, 2],
  ["ireis", 1, 3],
  ["\xE1reis", 1, 4],
  ["\xE9reis", 1, 5],
  ["\xEDreis", 1, 6],
  ["\xE1sseis", 1, 7],
  ["\xE9sseis", 1, 8],
  ["\xEDsseis", 1, 9],
  ["\xE1veis", 1, 10],
  ["\xEDeis", 1, 11],
  ["ar\xEDeis", 1, 1],
  ["er\xEDeis", 1, 2],
  ["ir\xEDeis", 1, 3],
  ["ados", 1],
  ["idos", 1],
  ["amos", 1],
  ["\xE1ramos", 1, 1],
  ["\xE9ramos", 1, 2],
  ["\xEDramos", 1, 3],
  ["\xE1vamos", 1, 4],
  ["\xEDamos", 1, 5],
  ["ar\xEDamos", 1, 1],
  ["er\xEDamos", 1, 2],
  ["ir\xEDamos", 1, 3],
  ["emos", 1],
  ["aremos", 1, 1],
  ["eremos", 1, 2],
  ["iremos", 1, 3],
  ["\xE1ssemos", 1, 4],
  ["\xEAssemos", 1, 5],
  ["\xEDssemos", 1, 6],
  ["imos", 1],
  ["armos", 1],
  ["ermos", 1],
  ["irmos", 1],
  ["\xE1mos", 1],
  ["ar\xE1s", 1],
  ["er\xE1s", 1],
  ["ir\xE1s", 1],
  ["eu", 1],
  ["iu", 1],
  ["ou", 1],
  ["ar\xE1", 1],
  ["er\xE1", 1],
  ["ir\xE1", 1]
];
const a_7 = [
  ["a", 1],
  ["i", 1],
  ["o", 1],
  ["os", 1],
  ["\xE1", 1],
  ["\xED", 1],
  ["\xF3", 1]
];
const a_8 = [
  ["e", 1],
  ["\xE7", 2],
  ["\xE9", 1],
  ["\xEA", 1]
];
const g_v = [17, 65, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 19, 12, 2];
class PortugueseStemmer extends SnowballStemmer {
  #I_p2 = 0;
  #I_p1 = 0;
  #I_pV = 0;
  #r_prelude() {
    let a;
    while (true) {
      const v_1 = this.c;
      lab0: {
        this.bra = this.c;
        a = this.find_among(a_0);
        this.ket = this.c;
        switch (a) {
          case 1: {
            this.slice_from("a~");
            break;
          }
          case 2: {
            this.slice_from("o~");
            break;
          }
          case 3: {
            if (this.c >= this.limit) break lab0;
            this.c++;
            break;
          }
        }
        continue;
      }
      this.c = v_1;
      break;
    }
    return true;
  }
  #r_mark_regions() {
    this.#I_pV = this.limit;
    this.#I_p1 = this.limit;
    this.#I_p2 = this.limit;
    const v_1 = this.c;
    lab0: {
      lab1: {
        const v_2 = this.c;
        lab2: {
          if (!this.in_grouping(g_v, 97, 250)) break lab2;
          lab3: {
            const v_3 = this.c;
            lab4: {
              if (!this.out_grouping(g_v, 97, 250)) break lab4;
              if (!this.go_out_grouping(g_v, 97, 250)) break lab4;
              this.c++;
              break lab3;
            }
            this.c = v_3;
            if (!this.in_grouping(g_v, 97, 250)) break lab2;
            if (!this.go_in_grouping(g_v, 97, 250)) break lab2;
            this.c++;
          }
          break lab1;
        }
        this.c = v_2;
        if (!this.out_grouping(g_v, 97, 250)) break lab0;
        lab5: {
          const v_4 = this.c;
          lab6: {
            if (!this.out_grouping(g_v, 97, 250)) break lab6;
            if (!this.go_out_grouping(g_v, 97, 250)) break lab6;
            this.c++;
            break lab5;
          }
          this.c = v_4;
          if (!this.in_grouping(g_v, 97, 250)) break lab0;
          if (this.c >= this.limit) break lab0;
          this.c++;
        }
      }
      this.#I_pV = this.c;
    }
    this.c = v_1;
    const v_5 = this.c;
    lab7: {
      if (!this.go_out_grouping(g_v, 97, 250)) break lab7;
      this.c++;
      if (!this.go_in_grouping(g_v, 97, 250)) break lab7;
      this.c++;
      this.#I_p1 = this.c;
      if (!this.go_out_grouping(g_v, 97, 250)) break lab7;
      this.c++;
      if (!this.go_in_grouping(g_v, 97, 250)) break lab7;
      this.c++;
      this.#I_p2 = this.c;
    }
    this.c = v_5;
    return true;
  }
  #r_postlude() {
    let a;
    while (true) {
      const v_1 = this.c;
      lab0: {
        this.bra = this.c;
        a = this.find_among(a_1);
        this.ket = this.c;
        switch (a) {
          case 1: {
            this.slice_from("\xE3");
            break;
          }
          case 2: {
            this.slice_from("\xF5");
            break;
          }
          case 3: {
            if (this.c >= this.limit) break lab0;
            this.c++;
            break;
          }
        }
        continue;
      }
      this.c = v_1;
      break;
    }
    return true;
  }
  #r_RV() {
    return this.#I_pV <= this.c;
  }
  #r_R2() {
    return this.#I_p2 <= this.c;
  }
  #r_standard_suffix() {
    let a;
    this.ket = this.c;
    a = this.find_among_b(a_5);
    if (a === 0) return false;
    this.bra = this.c;
    switch (a) {
      case 1: {
        if (!this.#r_R2()) return false;
        this.slice_del();
        break;
      }
      case 2: {
        if (!this.#r_R2()) return false;
        this.slice_from("log");
        break;
      }
      case 3: {
        if (!this.#r_R2()) return false;
        this.slice_from("u");
        break;
      }
      case 4: {
        if (!this.#r_R2()) return false;
        this.slice_from("ente");
        break;
      }
      case 5: {
        if (this.#I_p1 > this.c) return false;
        this.slice_del();
        const v_1 = this.limit - this.c;
        lab0: {
          this.ket = this.c;
          a = this.find_among_b(a_2);
          if (a === 0) {
            this.c = this.limit - v_1;
            break lab0;
          }
          this.bra = this.c;
          if (!this.#r_R2()) {
            this.c = this.limit - v_1;
            break lab0;
          }
          this.slice_del();
          switch (a) {
            case 1: {
              this.ket = this.c;
              if (!this.eq_s_b("at")) {
                this.c = this.limit - v_1;
                break lab0;
              }
              this.bra = this.c;
              if (!this.#r_R2()) {
                this.c = this.limit - v_1;
                break lab0;
              }
              this.slice_del();
              break;
            }
          }
        }
        break;
      }
      case 6: {
        if (!this.#r_R2()) return false;
        this.slice_del();
        const v_2 = this.limit - this.c;
        lab1: {
          this.ket = this.c;
          if (this.find_among_b(a_3) === 0) {
            this.c = this.limit - v_2;
            break lab1;
          }
          this.bra = this.c;
          if (!this.#r_R2()) {
            this.c = this.limit - v_2;
            break lab1;
          }
          this.slice_del();
        }
        break;
      }
      case 7: {
        if (!this.#r_R2()) return false;
        this.slice_del();
        const v_3 = this.limit - this.c;
        lab2: {
          this.ket = this.c;
          if (this.find_among_b(a_4) === 0) {
            this.c = this.limit - v_3;
            break lab2;
          }
          this.bra = this.c;
          if (!this.#r_R2()) {
            this.c = this.limit - v_3;
            break lab2;
          }
          this.slice_del();
        }
        break;
      }
      case 8: {
        if (!this.#r_R2()) return false;
        this.slice_del();
        const v_4 = this.limit - this.c;
        lab3: {
          this.ket = this.c;
          if (!this.eq_s_b("at")) {
            this.c = this.limit - v_4;
            break lab3;
          }
          this.bra = this.c;
          if (!this.#r_R2()) {
            this.c = this.limit - v_4;
            break lab3;
          }
          this.slice_del();
        }
        break;
      }
      case 9: {
        if (!this.#r_RV()) return false;
        if (!this.eq_s_b("e")) return false;
        this.slice_from("ir");
        break;
      }
    }
    return true;
  }
  #r_verb_suffix() {
    if (this.c < this.#I_pV) return false;
    const v_1 = this.limit_backward;
    this.limit_backward = this.#I_pV;
    this.ket = this.c;
    if (this.find_among_b(a_6) === 0) {
      this.limit_backward = v_1;
      return false;
    }
    this.bra = this.c;
    this.slice_del();
    this.limit_backward = v_1;
    return true;
  }
  #r_residual_suffix() {
    this.ket = this.c;
    if (this.find_among_b(a_7) === 0) return false;
    this.bra = this.c;
    if (!this.#r_RV()) return false;
    this.slice_del();
    return true;
  }
  #r_residual_form() {
    let a;
    this.ket = this.c;
    a = this.find_among_b(a_8);
    if (a === 0) return false;
    this.bra = this.c;
    switch (a) {
      case 1: {
        if (!this.#r_RV()) return false;
        this.slice_del();
        this.ket = this.c;
        lab0: {
          const v_1 = this.limit - this.c;
          lab1: {
            if (!this.eq_s_b("u")) break lab1;
            this.bra = this.c;
            const v_2 = this.limit - this.c;
            if (!this.eq_s_b("g")) break lab1;
            this.c = this.limit - v_2;
            break lab0;
          }
          this.c = this.limit - v_1;
          if (!this.eq_s_b("i")) return false;
          this.bra = this.c;
          const v_3 = this.limit - this.c;
          if (!this.eq_s_b("c")) return false;
          this.c = this.limit - v_3;
        }
        if (!this.#r_RV()) return false;
        this.slice_del();
        break;
      }
      case 2: {
        this.slice_from("c");
        break;
      }
    }
    return true;
  }
  #stem() {
    const v_1 = this.c;
    this.#r_prelude();
    this.c = v_1;
    this.#r_mark_regions();
    this.limit_backward = this.c;
    this.c = this.limit;
    const v_2 = this.limit - this.c;
    lab0: {
      lab1: {
        const v_3 = this.limit - this.c;
        lab2: {
          const v_4 = this.limit - this.c;
          lab3: {
            const v_5 = this.limit - this.c;
            lab4: {
              if (!this.#r_standard_suffix()) break lab4;
              break lab3;
            }
            this.c = this.limit - v_5;
            if (!this.#r_verb_suffix()) break lab2;
          }
          this.c = this.limit - v_4;
          const v_6 = this.limit - this.c;
          lab5: {
            this.ket = this.c;
            if (!this.eq_s_b("i")) break lab5;
            this.bra = this.c;
            const v_7 = this.limit - this.c;
            if (!this.eq_s_b("c")) break lab5;
            this.c = this.limit - v_7;
            if (!this.#r_RV()) break lab5;
            this.slice_del();
          }
          this.c = this.limit - v_6;
          break lab1;
        }
        this.c = this.limit - v_3;
        if (!this.#r_residual_suffix()) break lab0;
      }
    }
    this.c = this.limit - v_2;
    const v_8 = this.limit - this.c;
    this.#r_residual_form();
    this.c = this.limit - v_8;
    this.c = this.limit_backward;
    const v_9 = this.c;
    this.#r_postlude();
    this.c = v_9;
    return true;
  }
  stem(input) {
    this.setCurrent(input);
    this.#stem();
    return this.getCurrent();
  }
}
const stemmer = new PortugueseStemmer();
const stem_pt = (word) => stemmer.stem(word);

export { stem_pt as s };
