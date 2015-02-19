function request(url, method, data, call) {
    if (method instanceof Function) {
        data = method;
        method = 'GET';
    }
    if (data instanceof Function) {
        call = data;
        data = null;
    }
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (call)
        xhr.addEventListener('loadend', function() {
            switch (xhr.status) {
                case 200:
                case 304:
                    call(xhr);
                    break;
                case 404:
                    report('File ' + url + ' not found');
                    break;
                default:
                    report(xhr.status + ' ' + xhr.statusText + ' ' + url);

            }
        });
    xhr.addEventListener('error', function() {
        report(xhr.status + ' ' + xhr.statusText + ' ' + url);
    });
    xhr.send(data);
    return xhr;
}

var stopwords = {};

var formats = {
    'stopwords': 'list'
};

function load(resource, language, call) {
    if (!call)
        call = Function();
    if (window[resource][language])
        call();
    else {
        var format = formats[resource];
        request(resource + '/' + language + (format ? '.' + format : ''), function (xhr) {
            var object = xhr.responseText;
            switch (format) {
                case 'list':
                    object = object.split('\n');
                    break;
                case 'json':
                    object = JSON.parse(object);
                    break;
            }
            if (window[resource])
                window[resource][language] = object;
            else
                report('Resource bundle ' + resource + ' not found');
            call();
        });
    }
}

function load_resources($tab, call) {
    var resources;
    if ('string' == typeof $tab)
        $tab = tabs.section($tab);
    if ($tab instanceof Element)
        resources = $tab.dataset.require;
    if ('string' == typeof resources)
        resources = resources.trim().replace(/\s+/g, ' ').split(' ');
    if (resources) {
        var res;
        while (res = resources.shift()) {
            load(res, $language.value, function () {
                if (0 == resources.length)
                    call();
            });

        }
    }
}

function report(exception) {
    $error.innerHTML = 'string' == typeof exception ? exception : exception.message;
}

var tabs = {
    open: function(id) {
        if (!tabs.isVisible(id)) {
            tabs.hide();
            var $label = tabs.label(id);
            var $section = tabs.section(id);
            $label.classList.add('visible');
            $section.classList.add('visible');
            return [$section, $label];
        }
    },

    label: function(id) {
        return tabs.$labels.querySelector('[for=' + id + ']');
    },

    section: function(id) {
        return window[id];
    },

    hide: function() {
        var $labels = tabs.$labels.querySelectorAll('.visible');
        var $sections = tabs.$sections.querySelectorAll('.visible');
        var i;
        for (i = 0; i < $labels.length; i++)
            $labels[i].classList.remove('visible');
        for (i = 0; i < $sections.length; i++)
            $sections[i].classList.remove('visible');
        if ($labels.length > 1)
            console.error($labels.length + ' visible labels');
        if ($sections.length > 1)
            console.error($sections.length + ' visible sections');
        return [$sections[0], $labels[0]];
    },

    isVisible: function(id) {
        var $visible = tabs.section(id);
        return $visible && id == $visible.id;
    },

    get $current() {
        return $$('.tabs > article > section.visible');
    },

    get $labels() {
        return $all('.tabs > :first-child > label');
    },

    get $sections() {
        return $all('.tabs > article > section');
    }
};

function $$(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

document.addEventListener('DOMContentLoaded', function() {
    var $labels = tabs.$labels;
    var $sections = tabs.$sections;
    for (var i = 0; i < $labels.length; i++) {
        var $label = $labels[i];
        $label.onclick = function() {
            var id = this.getAttribute('for');
            load_resources(id, function() {
                tabs.open(id);
            });
        }
    }
    tabs.open(localStorage.tab || $sections[0].id);

    $language.onchange = function() {
        load_resources(tabs.$current);
    };
});