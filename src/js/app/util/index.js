String.prototype.withFixedAccents = function() {
  try {
    return decodeURIComponent(escape(this));
  }
  catch (err) {
    return this;
  }
};

String.prototype.repeat = function(count) {
  'use strict';
  if (this == null) {
    throw new TypeError('can\'t convert ' + this + ' to object');
  }
  var str = '' + this;
  count = +count;
  if (count != count) {
    count = 0;
  }
  if (count < 0) {
    throw new RangeError('repeat count must be non-negative');
  }
  if (count == Infinity) {
    throw new RangeError('repeat count must be less than infinity');
  }
  count = Math.floor(count);
  if (str.length == 0 || count == 0) {
    return '';
  }
  if (str.length * count >= 1 << 28) {
    throw new RangeError('repeat count must not overflow maximum string size');
  }
  var rpt = '';
  for (var i = 0; i < count; i++) {
    rpt += str;
  }
  return rpt;
}

String.prototype.padStart = function padStart(targetLength,padString) {
  targetLength = targetLength>>0;
  padString = String(padString || ' ');
  if (this.length > targetLength) {
    return String(this);
  }
  else {
    targetLength = targetLength-this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength/padString.length);
    }
    return padString.slice(0,targetLength) + String(this);
  }
};

String.prototype.padEnd = function padEnd(targetLength,padString) {
  targetLength = targetLength>>0;
  padString = String(padString || ' ');
  if (this.length > targetLength) {
    return String(this);
  }
  else {
    targetLength = targetLength-this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength/padString.length);
    }
    return String(this) + padString.slice(0,targetLength);
  }
};
