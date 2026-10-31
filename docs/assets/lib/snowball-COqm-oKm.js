class SnowballStemmer {
  current = "";
  c = 0;
  limit = 0;
  limit_backward = 0;
  bra = 0;
  ket = 0;
  /** Index of the among function that the current among entry selected. */
  af = 0;
  setCurrent(value) {
    this.current = value;
    this.c = 0;
    this.limit = value.length;
    this.limit_backward = 0;
    this.bra = this.c;
    this.ket = this.limit;
  }
  getCurrent() {
    return this.current;
  }
  inSet(s, min, max, ch) {
    if (ch > max || ch < min) return false;
    ch -= min;
    return (s[ch >>> 3] & 1 << (ch & 7)) !== 0;
  }
  in_grouping(s, min, max) {
    if (this.c >= this.limit || !this.inSet(s, min, max, this.current.charCodeAt(this.c))) return false;
    this.c++;
    return true;
  }
  go_in_grouping(s, min, max) {
    while (this.c < this.limit) {
      if (!this.inSet(s, min, max, this.current.charCodeAt(this.c))) return true;
      this.c++;
    }
    return false;
  }
  in_grouping_b(s, min, max) {
    if (this.c <= this.limit_backward || !this.inSet(s, min, max, this.current.charCodeAt(this.c - 1))) return false;
    this.c--;
    return true;
  }
  go_in_grouping_b(s, min, max) {
    while (this.c > this.limit_backward) {
      if (!this.inSet(s, min, max, this.current.charCodeAt(this.c - 1))) return true;
      this.c--;
    }
    return false;
  }
  out_grouping(s, min, max) {
    if (this.c >= this.limit || this.inSet(s, min, max, this.current.charCodeAt(this.c))) return false;
    this.c++;
    return true;
  }
  go_out_grouping(s, min, max) {
    while (this.c < this.limit) {
      if (this.inSet(s, min, max, this.current.charCodeAt(this.c))) return true;
      this.c++;
    }
    return false;
  }
  out_grouping_b(s, min, max) {
    if (this.c <= this.limit_backward || this.inSet(s, min, max, this.current.charCodeAt(this.c - 1))) return false;
    this.c--;
    return true;
  }
  go_out_grouping_b(s, min, max) {
    while (this.c > this.limit_backward) {
      if (this.inSet(s, min, max, this.current.charCodeAt(this.c - 1))) return true;
      this.c--;
    }
    return false;
  }
  eq_s(s) {
    if (this.limit - this.c < s.length || !this.current.startsWith(s, this.c)) return false;
    this.c += s.length;
    return true;
  }
  eq_s_b(s) {
    if (this.c - this.limit_backward < s.length || !this.current.endsWith(s, this.c)) return false;
    this.c -= s.length;
    return true;
  }
  /** Binary search for the longest entry of the sorted table `v` that matches at the cursor. */
  find_among(v, call_among_func) {
    let i = 0;
    let j = v.length;
    const c = this.c;
    const l = this.limit;
    let common_i = 0;
    let common_j = 0;
    let first_key_inspected = false;
    while (true) {
      const k = i + (j - i >>> 1);
      let diff = 0;
      let common = common_i < common_j ? common_i : common_j;
      const w = v[k][0];
      for (let i2 = common; i2 < w.length; i2++) {
        if (c + common === l) {
          diff = -1;
          break;
        }
        diff = this.current.charCodeAt(c + common) - w.charCodeAt(i2);
        if (diff !== 0) break;
        common++;
      }
      if (diff < 0) {
        j = k;
        common_j = common;
      } else {
        i = k;
        common_i = common;
      }
      if (j - i <= 1) {
        if (i > 0 || j === i || first_key_inspected) break;
        first_key_inspected = true;
      }
    }
    while (true) {
      const w = v[i];
      if (common_i >= w[0].length) {
        this.c = c + w[0].length;
        if (w[3] === void 0) return w[1];
        this.af = w[3];
        if (call_among_func.call(this)) {
          this.c = c + w[0].length;
          return w[1];
        }
      }
      if (!w[2]) return 0;
      i -= w[2];
    }
  }
  /** find_among for backward mode: matches entries ending at the cursor. */
  find_among_b(v, call_among_func) {
    let i = 0;
    let j = v.length;
    const c = this.c;
    const lb = this.limit_backward;
    let common_i = 0;
    let common_j = 0;
    let first_key_inspected = false;
    while (true) {
      const k = i + (j - i >> 1);
      let diff = 0;
      let common = common_i < common_j ? common_i : common_j;
      const w = v[k][0];
      for (let i2 = w.length - 1 - common; i2 >= 0; i2--) {
        if (c - common === lb) {
          diff = -1;
          break;
        }
        diff = this.current.charCodeAt(c - 1 - common) - w.charCodeAt(i2);
        if (diff !== 0) break;
        common++;
      }
      if (diff < 0) {
        j = k;
        common_j = common;
      } else {
        i = k;
        common_i = common;
      }
      if (j - i <= 1) {
        if (i > 0 || j === i || first_key_inspected) break;
        first_key_inspected = true;
      }
    }
    while (true) {
      const w = v[i];
      if (common_i >= w[0].length) {
        this.c = c - w[0].length;
        if (w[3] === void 0) return w[1];
        this.af = w[3];
        if (call_among_func.call(this)) {
          this.c = c - w[0].length;
          return w[1];
        }
      }
      if (!w[2]) return 0;
      i -= w[2];
    }
  }
  replace_s(c_bra, c_ket, s) {
    const adjustment = s.length - (c_ket - c_bra);
    this.current = this.current.slice(0, c_bra) + s + this.current.slice(c_ket);
    this.limit += adjustment;
    if (this.c >= c_ket) this.c += adjustment;
    else if (this.c > c_bra) this.c = c_bra;
    return adjustment;
  }
  slice_from(s) {
    this.replace_s(this.bra, this.ket, s);
    this.ket = this.bra + s.length;
  }
  slice_del() {
    this.slice_from("");
  }
  insert(c_bra, c_ket, s) {
    const adjustment = this.replace_s(c_bra, c_ket, s);
    if (c_bra <= this.bra) this.bra += adjustment;
    if (c_bra <= this.ket) this.ket += adjustment;
  }
  slice_to() {
    return this.current.slice(this.bra, this.ket);
  }
}

export { SnowballStemmer as S };
