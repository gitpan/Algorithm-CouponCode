/*
 * couponCode - jQuery plugin
 *
 * Copyright (c) 2011 Grant McLean (grant@mclean.net.nz)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

(function($) {

var SYMBOL_SET = '0123456789ABCDEFGHJKLMNPQRTUVWXY';
var BAD_SYMBOL = new RegExp('[^' + SYMBOL_SET + ']');

$.fn.couponCode = function(options) {
    return this.each(function() {
        $.fn.couponCode.build(this, options);
    });
};

$.fn.couponCode.build = function(base_entry, options) {
    var self    = $.extend({}, $.fn.couponCode.defaults, options);
    self.focus  = null;
    self.inputs = [];
    self.flags  = [];
    self.parts  = parseInt(self.parts, 10);
    if(isNaN(self.parts) || self.parts < 1 || self.parts > 6) {
        alert("CouponCode 'parts' must be in range 1-6");
        return;
    }

    var name    = base_entry.name;
    var id      = base_entry.id;
    var wrapper = $( $(base_entry).wrap('<span class="jq-couponcode" />').parent()[0] );
    wrapper[0].removeChild(base_entry);
    var hidden  = $('<input type="hidden">').attr({ 'name': name, 'id': id });
    wrapper.append(hidden);
    var inner   = $('<span class="jq-couponcode-inner" />');
    for(var i = 0; i < self.parts; i++) {
        if(i > 0) {
            inner.append($('<span class="jq-couponcode-sep" />').text(self.separator));
        }
        self.inputs[i] = $('<input type="text" class="jq-couponcode-part" />');
        inner.append(self.inputs[i]);
    }
    $( self.inputs ).each(function(i, input) {
        input
        .keydown(function() { setTimeout(function() { validate(i); }, 5 ); } )
        .blur(function() { self.focus = null; validate(i); } )
        .focus( function() { self.focus = i; } );
    });
    self.inputs[0].on('paste', function(e) {
        setTimeout(function() { after_paste(e); }, 2);
    });
    wrapper.append(inner);
    if(self.setFocus) {
        self.inputs[0].focus();
    }

    function after_paste(e) {
        var parts = self.inputs[0].val().split('-');
        for(var i = 0; i < self.parts; i++) {
            self.inputs[i].val( parts[i] || '');
            validate(i);
        }
    }

    function validate(index) {
        var input  = self.inputs[index];
        var result = validate_one_field(input, index);
        if(result === true) {
            input.removeClass('jq-couponcode-bad');
            input.addClass('jq-couponcode-good');
            self.flags[index] = 1;
        }
        else {
            input.removeClass('jq-couponcode-good');
            input.removeClass('jq-couponcode-bad');
            if(result === false) {
                input.addClass('jq-couponcode-bad');
            }
            self.flags[index] = 0;
        }
        update_hidden_field();
    }

    function validate_one_field(input, index) {
        var val = input.val();
        var focussed = (self.focus === index);
        if(val == '') { return; }
        var code = clean_up( val );
        if(code.length > 4 || BAD_SYMBOL.test(code)) {
            return false;
        }
        if(code.length < 4) {
            return focussed ? null : false;
        }
        if(code.charAt(3) != checkdigit(code, index + 1)) {
            return false;
        }
        if(val != code) {
            input.val(code);
        }
        if(focussed && (index < self.parts - 1)) {
            self.inputs[index + 1].focus();
            self.focus = index + 1;
        }
        return true;
    }

    function clean_up(code) {
        code = code.toUpperCase()
               .replace(/ /g, '')
               .replace(/O/g, '0')
               .replace(/I/g, '1')
               .replace(/S/g, '5')
               .replace(/Z/g, '2');
        return code;
    }

    function checkdigit(data, pos) {
        var check = pos;
        for(var i = 0; i < 3; i++) {
            var k = SYMBOL_SET.indexOf( data.charAt(i) );
            check = check * 19 + k;
        }
        return SYMBOL_SET.charAt(check % 31);
    }

    function update_hidden_field() {
        var parts    = [];
        var old_code = hidden.val();
        $( self.inputs ).each(function(i, input) {
            parts.push(input.val());
        });
        var new_code = parts.join('-');
        if(old_code == new_code) {
            return;
        }
        hidden.val(new_code);
        if(self.onChange) {
            var good_parts = 0;
            $( self.flags ).each(function(i, val) { good_parts = good_parts + val; });
            self.onChange(good_parts === self.parts);
        }
    }

};

$.fn.couponCode.defaults = {
    parts     : 3,
    separator : '-',
    setFocus  : false
};

})(jQuery);
