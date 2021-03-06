backupApp.service('AppUtils', function(DialogService) {

    var apputils = this;

    try {
        moment.locale(
            navigator.languages
            ? navigator.languages[0]
            : (navigator.language || navigator.userLanguage)
        );
    } catch (e) {
    }    

    this.formatSizes = ['TB', 'GB', 'MB', 'KB'];
    this.formatSizeString = function(val) {
        val = parseInt(val || 0);
        var max = this.formatSizes.length;
        for(var i = 0; i < this.formatSizes.length; i++) {
            var m = Math.pow(1024, max - i);
            if (val > m)
                return (val / m).toFixed(2) + ' ' + this.formatSizes[i];
        }

        return val + ' ' + bytes;
    };

    this.fileSizeMultipliers = [
        {name: 'byte', value: ''},
        {name: 'KByte', value: 'KB'},
        {name: 'MByte', value: 'MB'},
        {name: 'GByte', value: 'GB'},
        {name: 'TByte', value: 'TB'}
    ];

    this.timerangeMultipliers = [
        {name: 'Minute', value: 'm'},
        {name: 'Hour', value: 'h'},
        {name: 'Day', value: 'D'},
        {name: 'Week', value: 'W'},
        {name: 'Month', value: 'M'},
        {name: 'Year', value: 'Y'}
    ];

    this.daysOfWeek = [
        {name: 'Mon', value: 'mon'}, 
        {name: 'Tue', value: 'tue'}, 
        {name: 'Wed', value: 'wed'}, 
        {name: 'Thu', value: 'thu'}, 
        {name: 'Fri', value: 'fri'}, 
        {name: 'Sat', value: 'sat'}, 
        {name: 'Sun', value: 'sun'}
    ];

    this.parseBoolString = function(txt, def) {
        txt = (txt || '').toLowerCase();
        if (txt == '0' || txt == 'false' || txt == 'off' || txt == 'no' || txt == 'f') 
            return false;
        else if (txt == '1' || txt == 'true' || txt == 'on' || txt == 'yes' || txt == 't')
            return true;
        else
            return def === undefined ? false : def;
    };


    this.splitSizeString = function(val) {
        var m = (/(\d*)(\w*)/mg).exec(val);
        var mul = null;
        if (!m)
            return [parseInt(val), null];
        else
            return [parseInt(m[1]), m[2]];
    }


    this.toDisplayDateAndTime = function(dt) {
        return moment(dt).format('lll');
    };

    this.parseDate = function(dt) {
        if (typeof(dt) == typeof('')) {
            var msec = Date.parse(dt);
            if (isNaN(msec)) {
                if (dt.length == 16 && dt[8] == 'T' && dt[15] == 'Z') {
                    dt = dt.substr(0, 4) + '-' + dt.substr(4, 2) + '-' + dt.substr(6, 2) + 'T' +
                              dt.substr(9, 2) + ':' + dt.substr(11, 2) + ':' + dt.substr(13, 2) + 'Z';
                }
                return new Date(dt);
            } else {
                return new Date(msec);
            }
        }
        else
            return new Date(dt);
    };    

    this.parseOptionStrings = function(val, dict, validateCallback) {
        dict = dict || {};

        var lines = null;

        if (val != null && typeof(val) == typeof([]))
            lines = val;
        else
            lines = this.replace_all(val || '', '\r', '\n').split('\n');

        for(var i in lines) {
            var line = lines[i].trim();
            if (line != '' && line[0] != '#') {
                if (line.indexOf('--') == 0) {
                    line = line.substr(2);
                }

                var eqpos = line.indexOf('=');
                var key = line;
                var value = true;
                if (eqpos > 0) {
                    key = line.substr(0, eqpos).trim();
                    value = line.substr(eqpos + 1).trim();
                    if (value == '')
                        value = true;
                }

                if (validateCallback)
                    if (!validateCallback(dict, key, value))
                        return null;

                dict['--' + key] = value;
            }
        }

        return dict;
    };

    this.parse_extra_options = function(str, dict) {
        return this.parseOptionStrings(str, dict, function(d, k, v) {
            if (d['--' + k] !== undefined) {
                DialogService.dialog('Error', 'Duplicate option ' + k);
                return false;
            }

            return true;
        }) != null;
    };

    this.serializeAdvancedOptions = function(opts) {
        return this.serializeAdvancedOptionsToArray(opts).join('\n');
    };

    this.serializeAdvancedOptionsToArray = function(opts) {
        var res = [];
        for(var n in opts)
            if (n.indexOf('--') == 0)
                res.push(n + '=' + opts[n]);

        return res;
    };

    this.mergeAdvancedOptions = function(advStr, target, source) {
        var adv = {}
        if (!this.parse_extra_options(advStr, adv))
            return false;

        angular.extend(target, adv);

        // Remove advanced options, no longer in the list
        for(var n in source)
            if (n.indexOf('--') == 0)
                if (target[n] === undefined)
                    target[n] = null;

    };

    this.notifyInputError = function(msg) {
        DialogService.dialog('Error', msg);
        return false;
    };

    this.connectionError = function(txt, msg) {
        if (typeof(txt) == typeof('')) {
            if (msg == null)
                return function(msg) {
                    if (msg && msg.data && msg.data.Message)
                        DialogService.dialog('Error', txt + msg.data.Message);
                    else
                        DialogService.dialog('Error', txt + msg.statusText);
                };
        } else {
            msg = txt;
            txt = '';
        }

        if (msg && msg.data && msg.data.Message)
            DialogService.dialog('Error', txt + msg.data.Message);
        else
            DialogService.dialog('Error', txt + msg.statusText);
    };

    this.generatePassphrase = function() {
        var specials = '!@#$%^&*()_+{}:"<>?[];\',./';
        var lowercase = 'abcdefghijklmnopqrstuvwxyz';
        var uppercase = lowercase.toUpperCase();
        var numbers = '0123456789';
        var all = specials + lowercase + uppercase + numbers;

        function choose(str, n) {
            var res = '';
            for (var i = 0; i < n; i++) {
                res += str.charAt(Math.floor(Math.random() * str.length));
            }

            return res;
        };

        var pwd = (
            choose(specials, 2) +
            choose(lowercase, 2) +
            choose(uppercase, 2) +
            choose(numbers, 2) +
            choose(all, (Math.random()*5) + 5)
        ).split('');

        for(var i = 0; i < pwd.length; i++) {
            var pos = parseInt(Math.random() * pwd.length);
            var t = pwd[i]
            pwd[i] = pwd[pos];
            pwd[pos] = t;
        }

        return pwd.join('');        
    }

    this.nl2br = function(str, is_xhtml) {
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
    };

    this.preg_quote = function( str ) {
        // http://kevin.vanzonneveld.net
        // +   original by: booeyOH
        // +   improved by: Ates Goral (http://magnetiq.com)
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Onno Marsman
        // *     example 1: preg_quote("$40");
        // *     returns 1: '\$40'
        // *     example 2: preg_quote("*RRRING* Hello?");
        // *     returns 2: '\*RRRING\* Hello\?'
        // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
        // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

        return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
    }

    this.replace_all_insensitive = function(str, pattern, replacement) {
      return str.replace( new RegExp( "(" + this.preg_quote(pattern) + ")" , 'gi' ), replacement );
    };

    this.replace_all = function(str, pattern, replacement) {
      return str.replace( new RegExp( "(" + this.preg_quote(pattern) + ")" , 'g' ), replacement );
    };

    this.format = function() {
        if (arguments == null || arguments.length < 1)
            return null;

        if (arguments.length == 1)
            return arguments[0];

        var msg = arguments[0];

        for(var i = 1; i < arguments.length; i++)
            msg = this.replace_all(msg, '{' + (i-1) + '}', arguments[i]);

        return msg;
    };

    this.encodeDictAsUrl = function(obj) {
            if (obj == null)
                return '';

            var str = [];
            for(var p in obj) {
                var x = encodeURIComponent(p);
                if (obj[p] != null)
                    x += "=" + encodeURIComponent(obj[p]);
                str.push(x);
            }

            if (str.length == 0)
                return '';

            return '?' + str.join("&");
    };

    var URL_REGEXP_FIELDS = ['source_uri', 'backend-type', '--auth-username', '--auth-password', 'server-name', 'server-port', 'server-path', 'querystring'];
    var URL_REGEXP = /([^:]+)\:\/\/(?:(?:([^\:]+)(?:\:?:([^@]*))?\@))?(?:([^\/\?\:]*)(?:\:(\d+))?)(?:\/([^\?]*))?(?:\?(.+))?/;
    var QUERY_REGEXP = /(?:^|&)([^&=]*)=?([^&]*)/g;

    this.decode_uri = function(uri, backendlist) {

        var i = URL_REGEXP_FIELDS.length + 1;
        var res = {};

        var m = URL_REGEXP.exec(uri);

        // Invalid URI
        if (!m)
            return res;

        while (i--) {
            res[URL_REGEXP_FIELDS[i]] = m[i] || "";
        }

        res.querystring.replace(QUERY_REGEXP, function(str, key, val) {
            if (key)
                res['--' + key] = decodeURIComponent(val);
        });

        var backends = {};
        for(var i in backendlist)
            backends[backendlist[i].Key] = true;

        var scheme = res['backend-type'];

        if (scheme && scheme[scheme.length - 1] == 's' && !backends[scheme] && backends[scheme.substr(0, scheme.length-1)]) {
            res['backend-type'] = scheme.substr(0, scheme.length-1);
            res['--use-ssl'] = true;
        }

        return res;
    };

    this.find_scheme = function(uri, backendlist) {
        if (!uri || uri.length == 0)
            return null;

        uri = uri.trim().toLowerCase();
        var ix = uri.indexOf('://');
        if (ix <= 0) {
            for(var i in backendlist)
                if (backendlist[i].Key == 'file')
                    return 'file';

            return backendlist[0];
        }

        return (EDIT_URI.decode_uri(uri)['backend-type'] || '').toLowerCase()
    };

    this.contains_value = function(dict, value) {
        for(var k in dict)
            if (dict[k] == value)
                return true;

        return false;
    };

    this.contains_key = function(dict, key, keyname) {
        for(var i in dict)
            if (keyname == null ? i == key : dict[i][keyname] == key)
                return true;

        return false;
    };


    this.removeEmptyEntries = function(x) {
        for (var i = x.length - 1; i >= 0; i--) {
            if (x[i] == null || x[i] == '')
                x.splice(i, 1);
        };

        return x;       
    };

    this.filterClasses = [{
        name: 'Exclude directories whose names contain',
        key: '-dir*',
        prefix: '-*',
        suffix: '*!',
        rx: '\\-\\*([^\\!]+)\\*\\!'
    }, {
        name: 'Exclude files whose names contain',
        key: '-file*',
        prefix: '-[.*',
        suffix: '.*[^!]]',
        rx: '\\-\\[\\.\\*([^\\!]+)\\.\\*\\[\\^\\!\\]\\]'
    }, {
        name: 'Exclude folder',
        key: '-folder',
        prefix: '-',
        suffix: '!',
        rx: '\\-(.*)\\!'
    }, {
        name: 'Exclude file',
        key: '-path',
        prefix: '-',
        exclude: ['*', '?'],
        rx: '\\-([^\\[\\*\\?]+)'
    }, {
        name: 'Exclude file extension',
        key: '-ext',
        rx: '\\-\\*\.(.*)',
        prefix: '-*.'
    }, {
        name: 'Exclude regular expression',
        key: '-[]',
        prefix: '-[',
        suffix: ']'
    }, {
        name: 'Include regular expression',
        key: '+[]',
        prefix: '+[',
        suffix: ']'
    }, {
        name: 'Include expression',
        key: '+',
        prefix: '+'
    }, {
        name: 'Exclude expression',
        key: '-',
        prefix: '-'
    }];

    this.filterTypeMap = {};
    for (var i = this.filterClasses.length - 1; i >= 0; i--)
        this.filterTypeMap[this.filterClasses[i].key] = this.filterClasses[i];

    this.splitFilterIntoTypeAndBody = function(src, dirsep) {
        if (src == null)
            return null;

        if (dirsep == null) {
            throw new Error('No dirsep provided!');
        }

        function matches(txt, n) {
            var pre = apputils.replace_all(n.prefix || '', '!', dirsep);
            var suf = apputils.replace_all(n.suffix || '', '!', dirsep);

            if (txt.indexOf(pre) != 0 || txt.lastIndexOf(suf) != txt.length - suf.length)
                return null;

            var type = n.key;
            var body = txt.substr(pre.length);
            body = body.substr(0, body.length - suf.length);

            if (body.length >= 2 && body[1] == '[') {
                body = body.substr(1, body.length - 2);
            }

            if (n.exclude != null) {
                for (var i = n.exclude.length - 1; i >= 0; i--)
                    if (body.indexOf(apputils.replace_all(n.exclude[i] || '', '!', dirsep)) >= 0)
                        return null;
            }

            return [type, body];
        }

        for(var i in this.filterClasses) {
            var n = matches(src, this.filterClasses[i]);
            if (n != null)
                return n;
        }

        return null;
    };

    this.buildFilter = function(type, body, dirsep) {
        if (type == null || this.filterTypeMap[type] == null)
            return body;

        body = body || '';

        var f = this.filterTypeMap[type];
        var pre = this.replace_all(f.prefix || '', '!', dirsep);
        var suf = this.replace_all(f.suffix || '', '!', dirsep);

        if (pre.length >= 2 && pre[1] == '[') {
            //Regexp encode body ....
        }

        return pre + body + suf;
    };

    this.filterListToRegexps = function(filters, caseSensitive) {
        var res = [];

        for(var i = 0; i < filters.length; i++) {
            var f = filters[i];
            
            if (f == null || f.length == 0)
                continue;

            var flag = f.substr(0, 1);
            var filter = f.substr(1);
            var rx = filter.substr(0, 1) == '[' && filter.substr(filter.length - 1, 1) == ']';
            if (rx) 
                filter = filter.substr(1, filter.length - 2);
            else
                filter = this.replace_all(this.replace_all(this.preg_quote(filter), '*', '.*'), '?', '.');
            
            try {
                res.push([flag == '+', new RegExp(filter, caseSensitive ? 'g' : 'gi')]);
            } catch (e) {
            }
        }

        return res;
    };

    this.evalFilter = function(path, filters, include) {
        for(var i = 0; i < filters.length; i++) {
            var m = path.match(filters[i][1]);
            if (m && m.length == 1 && m[0].length == path.length)
                return filters[i][0];
        }

        return include === undefined ? true : include;
    };

    this.buildOptionList = function(sysinfo, encmodule, compmodule, backmodule) {
        if (sysinfo == null || sysinfo.Options == null)
            return null;

        var items = angular.copy(sysinfo.Options);
        for(var n in items)
            items[n].Category = 'Core options';

        function copyToList(lst, key) {
            for(var n in lst)
            {
                if (key == null || key.toLowerCase() == lst[n].Key.toLowerCase())
                {
                    var m = angular.copy(lst[n].Options);
                    for(var i in m)
                        m[i].Category = lst[n].DisplayName;
                    items.push.apply(items, m);
                }
            }
        }

        copyToList(sysinfo.GenericModules);
        copyToList(sysinfo.ConnectionModules);

        if (encmodule !== false)
            copyToList(sysinfo.EncryptionModules, encmodule);
        if (compmodule !== false)
            copyToList(sysinfo.CompressionModules, compmodule);
        if (backmodule !== false)
            copyToList(sysinfo.BackendModules, backmodule);

        return items;
    };

});