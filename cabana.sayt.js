;(function ( $, window, document, undefined ) {
  var timer = undefined;

  $.widget("cabana.sayt", {
    // Options used as defaults
    options: {
      url: "/",
      keyboard: false,
      markup: function(results) {
        var markup = '';
        markup += '<ul>';
        for (var i=0; i < results.length; i++) {
          markup += '<li>';
          markup += '<a href="' + results[i].url + '">' + results[i].text + '</a>';
          markup += '</li>';
        };
        markup += '</ul>';
        return markup;
      },
      requestType: 'GET',
      dataType: 'json',
      contentType: "application/json; charset=utf-8",
      selectionClass: 'selection',
      data: function($elem) {
        return { query: $elem.val() };
      },
      minLength: 3,
      throttle: 250,
      containerClass: 'ajax-results'
    },

    // prefix all custom events that this widget will fire: "sayt:"
    widgetEventPrefix: 'sayt:',

    //set version
    version: '0.1',

    _create: function() {
      _this = this;

      _this._applyDataParams();

      // the results container isn't there so lets make it
      if ($('.' + _this.options.containerClass).length === 0) {
        this.element.after('<div class="' + _this.options.containerClass + '"></div>');
      }
      _this.options.resultsContainer = $('.' + _this.options.containerClass);

      _this.element.on('keydown', function(e) {
        if (timer) {
          window.clearTimeout(timer);
        }

        timer = window.setTimeout(function() {
          if (e.keyCode != 40 && e.keyCode != 38) {
            if (_this.element.val().length >= _this.options.minLength) {
              var results = _this._fetchResults();

              var markup;
              if ($('.' + _this.options.containerClass).length) {
                markup = _this.options.markup(results);
              } else {
                markup = '<div class="' + _this.options.containerClass + '">' +
                           _this.options.markup(results) +
                         '</div>';
              }

              _this._emptyResultsContainer();
              _this._inject(markup);
            } else {
              _this._emptyResultsContainer();
            }
          }
        }, _this.options.throttle);
      }).on('focus', function() {
        $('.' + _this.options.containerClass).find('.' + _this.options.selectionClass).removeClass(_this.options.selectionClass);
      });

      _this._bindKeyboardEvents();
    },

    _applyDataParams: function() {
      this._applyDataParam('keyboard', 'sayt-keyboard');
      this._applyDataParam('url', 'sayt-url');
      this._applyDataParam('requestType', 'sayt-request-type');
      this._applyDataParam('dataType', 'sayt-data-type');
      this._applyDataParam('contentType', 'sayt-content-type');
      this._applyDataParam('selectionClass', 'sayt-selection-class');
      this._applyDataParam('minLength', 'sayt-min-length');
      this._applyDataParam('throttle', 'sayt-throttle');
      this._applyDataParam('containerClass', 'sayt-container-class');
    },

    _applyDataParam: function(optionToSet, dataParam) {
      if ($(this.element).data(dataParam)) {
        this.options[optionToSet] = $(this.element).data(dataParam);
      }
    },

    _emptyResultsContainer: function() {
      if (this.options.resultsContainer) {
        this.options.resultsContainer.html('');
      }
    },

    _inject: function(markup) {
      if (this.options.resultsContainer.length) {
        this.options.resultsContainer.append(markup);
      } else {
        this.element.after(markup);
      }
    },

    _fetchResults: function() {
      var results;
      var _this = this;

      _this._trigger("fetch:starting", null, {
        element: this.element,
        options: this.options,
        data: _this.options.data(_this.element)
      });

      $.ajax({
        url: _this.options.url,
        contentType: _this.options.contentType,
        type: _this.options.requestType,
        dataType: _this.options.dataType,
        data: _this.options.data(_this.element),
        async: false
      }).done(function(json) {
        results = json;
      });

      _this._trigger("fetch:complete", null, {
        element: this.element,
        options: this.options,
        data: _this.options.data(_this.element),
        results: results
      });

      return results;
    },

    _thereAreResults: function() {
      return $('.' + this.options.containerClass).length;
    },

    _selectionMade: function() {
      return $('.' + this.options.containerClass).find('.' + this.options.selectionClass).length;
    },

    _bindKeyboardEvents: function() {
      var _this = this;

      if (_this.options.keyboard) {
        $(document).off('keydown').on('keydown', function(e) {
          if (_this._thereAreResults()) {
            if (e.keyCode === 13) {
              _this._goToSelection();
            } else if (e.keyCode === 40) {
              _this._moveSelectionDown();
              e.preventDefault();
            } else if (e.keyCode === 38) {
              _this._moveSelectionUp();
              e.preventDefault();
            }
          }
        });
      }
    },

    _goToSelection: function() {
      if (this._selectionMade()) {
        window.location.href = $('.' + this.options.containerClass).find('.' + this.options.selectionClass).attr('href');
      }
    },

    _moveSelectionDown: function() {
      var _this = this;

      if (_this._selectionMade()) {
        var $selection = $('.' + _this.options.containerClass).find('.' + _this.options.selectionClass)

        var links = $selection.parents('.' + _this.options.containerClass).find('a');
        for (var i = links.length - 1; i >= 0; i--) {
          if ($(links[i]).hasClass(_this.options.selectionClass)) {
            var $link = $(links[i]);
            var $nextLink = $(links[i+1]);
            var $lastLink = $(links[links.length-1]);

            $link.removeClass(_this.options.selectionClass);

            if ($link.is($lastLink)) {
              _this.element.focus();
            } else {
              $nextLink.addClass(_this.options.selectionClass);
            }

            break;
          }
        };
      } else {
        _this.element.blur();
        $('.' + _this.options.containerClass).find('a').first().addClass(_this.options.selectionClass);
      }
    },

    _moveSelectionUp: function() {
      var _this = this;

      if (_this._selectionMade()) {
        var $selection = $('.' + _this.options.containerClass).find('.' + _this.options.selectionClass)

        var links = $selection.parents('.' + _this.options.containerClass).find('a');
        for (var i = links.length - 1; i >= 0; i--) {
          if ($(links[i]).hasClass(_this.options.selectionClass)) {
            var $link = $(links[i]);
            var $prevLink = $(links[i-1]);
            var $firstLink = $(links[0]);

            $link.removeClass(_this.options.selectionClass);

            if ($link.is($firstLink)) {
              _this.element.focus();
            } else {
              $prevLink.addClass(_this.options.selectionClass);
            }

            break;
          }
        };
      } else {
        _this.element.blur();
        $('.' + _this.options.containerClass).find('a').last().addClass(_this.options.selectionClass);
      }
    },

    destroy: function() {
      this.element.unbind();
      this.options.resultsContainer.remove();
    },

    _setOption: function (key, value) {
      this.options[key] = value;
      this._bindKeyboardEvents();
      this._super( "_setOption", key, value );
    }
  });

})( jQuery, window, document );
