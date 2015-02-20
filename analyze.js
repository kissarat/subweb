var stopwords = {};

function canonize(text, language) {
    text = text.trim();
    if (!text)
        throw 'Text is empty';
    text = text.toLocaleLowerCase();
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\[\d+\]/g, '');
    // '\u2013' == '\x2d'
    text = text.replace(/(\d+) ?[\-–] ?(\d+)/g, function(match, start, end) {
        return start + ' ' + end;
    });
    text = text.replace(/[\.,!\?\*:;\-\(\)'"…†]/g, '');
    text = canonize[language](text);
    text = text.split(' ');
    return text;
}

canonize.en = function(text) {
    return text;
};

canonize.cyrillic = function(text) {
    return text.replace(/[–«»—́]/g, '');
};

canonize.uk = function(text) {
    text = canonize.cyrillic(text);
    text = text.replace(/(\d+) (рік|років|року|роках|рр|р) /g, function(match, year) {
        return year + ' ';
    });
    text = text.replace(/(\d+)(му|го|та|ший|гий|ій|й) /g, function(match, number) {
        return number + ' ';
    });
    return text;
};

function frequency_analyze(text) {
    var words = {};
    var word;
    for (var i = 0; i < text.length; i++) {
        word = text[i];
        words[word] = (words[word] || 0) + 1;
    }
    var f = [];
    for(word in words) {
        f.push([word, words[word]]);
    }
    f.sort(function(a, b) {
        return b[1] - a[1];
    });
    return f;
}
