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
    var output = [];
    var _stopwords = stopwords[language];
    for (var i = 0; i < text.length; i++) {
        var word = text[i];
        if (_stopwords.indexOf(word) < 0)
            output.push(word);
    }
    return output;
}

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
