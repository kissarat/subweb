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

var formats = {
    stopwords: 'list'
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
            load(res, $id('language').value, function () {
                if (0 == resources.length && call)
                    call();
            });

        }
    }
}

function report(exception) {
    $error.innerHTML = 'string' == typeof exception ? exception : exception.message;
}

function fire(event, $target) {
    event = new CustomEvent(event);
    $target.dispatchEvent(event);
}

function change($target, value) {
    $target.value = value;
    fire('event', $target);
}

function click($target) {
    fire('click', $target);
}

function reset($target) {
    if ($target instanceof Event)
        $target = this;
    change($target, $target.defaultValue);
}

var tabs = {
    open: function(id) {
        if (!tabs.isVisible(id)) {
            tabs.hide();
            var $section = tabs.section(id);
            if (id in init) {
                init[id].call($section);
                delete init[id];
            }
            var $label = tabs.label(id);
            if ($label)
                $label.classList.add('visible');
            $section.classList.add('visible');
            return [$section, $label];
        }
    },

    hide: function() {
        var $labels = tabs.labels('.visible');
        var $sections = tabs.sections('.visible');
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
        var $visible;
        if ('string' == typeof id)
            $visible = tabs.section(id);
        return $visible && $visible.classList.contains('visible');
    },

    get $current() {
        return $$('.tabs > article > section.visible');
    },

    label: function(id) {
        return $$('.tabs-buttons > label[for=' + id + ']');
    },

    section: function(id) {
        return $id(id);
    },

    labels: function(selector) {
        return $all('.tabs-buttons > label' + (selector ? selector : ''));
    },

    sections: function(selector) {
        return $all('.tabs > article > section' + (selector ? selector : ''));
    }
};

function $id(id) {
    return document.getElementById(id);
}

function $$(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

function $name(name) {
    var $field = document.getElementsByName(name);
    if ($field.length > 1)
        throw '[name="' + name + '"] is not single';
    return $field[0];
}

var encodings = ['utf-8', 'utf-16', 'cp1251', 'koi8'];

var widget = {
    create: function(name) {
        var $widget = $id('widgets')[name];
        if (!$widget)
            return $widget;
        $widget = $widget.cloneNode(true);
        $widget.querySelector('[type=file]').onchange = function(e) {
            try {
                var file = e.target.files[0];
                if (!window.FileReader)
                    throw 'Ваш браузер не підтримує читання з файлів';
                var reader = new FileReader();
                reader.onloadend = function(e) {
                    $widget.querySelector('[name=input]').value = e.target.result;
                };
                reader.readAsText(file, $id('encoding').value);
            }
            catch (ex) {
                report(ex);
            }
        };
        if (widget[name])
            return widget[name]($widget);
        else
            return $widget;
    },

    text_input: function($widget) {
        return $widget;
    }
};

//region load

var init = {
    canonization: function() {
        var $form = this.querySelector('form');
        var $input = widget.create('text_input');
        $form.insertBefore($input, $form.canonize);
        $form.canonize.onclick = function() {
            var text = canonize($form.input.value, $id('language').value);
            $form.output.value = text.join(' ');
        };
    },

    frequency_analysis: function() {
        var $form = this.querySelector('form');
        var $table = this.querySelector('table');
        var $input = widget.create('text_input');
        $form.insertBefore($input, $form.frequency_analyze);
        $form.frequency_analyze.onclick = function() {
            var text = canonize($form.input.value, $id('language').value);
            text = frequency_analyze(text);
            $table.remove();
            $table.innerHTML = '';
            for (var i = 0; i < text.length; i++) {
                var r = text[i];
                var $row = document.createElement('tr');
                var sw = stopwords[$id('language').value];
                if (sw.indexOf(r[0]) >= 0)
                    $row.classList.add('stopword');
                $row.innerHTML = '<td>' + r[0]
                    + '</td><td>' + r[1] + '</td>';
                $table.appendChild($row);
            }
            $form.parentNode.appendChild($table);
        };
        $form.stopwords.onchange = function() {
            if (this.checked)
                css_stopword.removeProperty('display');
            else
                css_stopword.display = 'none';
        };
    },

    diff: function() {
        var $form = this.querySelector('form');
        $form.compare.onclick = function() {
            $id('diff_html').innerHTML = diffString($form.one.value, $form.two.value);
        };
    },

    settings: function() {
        //if (!(window.matchMedia && matchMedia('max-width: 2in')))
        var $bg = $name('background');
        $bg.onchange = function() {
            var b = this.value;
            b = b.trim();
            b = b.replace(/\s+/g, '');
            var style = $id('background').style;
            style.removeProperty('background-color');
            style.removeProperty('background-image');
            localStorage.background = b;
            if (b) {
                if (/^#[0-9A-F]{6}$/i.test(b) || /^#[0-9A-F]{3}$/i.test(b)
                    || /^rgb\(\d{1,3},\d{1,3},\d{1,3}\)/i.test(b)
                    || /^rgba\(\d{1,3},\d{1,3},\d{1,3},0?\.\d+\)/i.test(b)) {
                    style.backgroundColor = b;
                }
                else
                    style.backgroundImage = 'url("' + b + '")';
            }
        };

        if ('background' in localStorage)
            change($bg, localStorage.background);
        else
            reset($bg);

        var $block = document.createElement('div');
        var $label = document.createElement('label');
        $label.innerHTML = $bg.getAttribute('placeholder');
        $bg.removeAttribute('placeholder');
        $block.appendChild($label);
        $block.appendChild($bg);
        var $reset = document.createElement('button');
        $reset.type = 'button';
        $reset.innerHTML = 'reset';
        $reset.onclick = reset.bind($bg);
        $block.appendChild($reset);
        this.querySelector('form').appendChild($block);
    }
};

var stored = ['language', 'encoding'];

document.addEventListener('DOMContentLoaded', function() {
    var $labels = tabs.labels();
    var i;
    for (i = 0; i < $labels.length; i++) {
        var $label = $labels[i];
        $label.onclick = function() {
            var id = this.getAttribute('for');
            load_resources(id, function() {
                tabs.open(id);
            });
        }
    }

    $id('language').onchange = function() {
        load_resources(tabs.$current);
    };

    if (window.TextDecoder) {
        var $encoding = $id('encoding');
        $encoding.style.removeProperty('display');
        $encoding.innerHTML = '';
        for (i = 0; i < encodings.length; i++) {
            var encoding = encodings[i];
            var $option = document.createElement('option');
            $option.value = encoding;
            $option.innerHTML = encoding;
            $encoding.appendChild($option);
        }
    }

    for (i = 0; i < stored.length; i++) {
        var key = stored[i];
        if (localStorage[key])
            $id(key).value = localStorage[key];
    }

    click(tabs.label(localStorage.tab) || $labels[0]);
});

var css_stopword;

onload = function() {
    var rules = document.styleSheets[0];
    rules = rules.cssRules || rules.rules;
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if ('.stopword' == rule.selectorText) {
            css_stopword = rule.style;
            break;
        }
    }
};

onunload = function() {
    localStorage.tab = tabs.$current.id;
    for (var i = 0; i < stored.length; i++) {
        var key = stored[i];
        localStorage[key] = $id(key).value;
    }
};

//endregion
