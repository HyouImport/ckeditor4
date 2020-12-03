/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @fileOverview Defines te {@link CKEDITOR.tools.color} class for handling different color formats.
 */

( function() {
	'use strict';

	/**
	 * Class representing a color. Provides conversion between various color formats:
	 *
	 * * Named colors.
	 * * Hexadecimal format (with alpha support).
	 * * RGB and RGBA formats.
	 * * HSL and HSLA formats.
	 *
	 * It can be used to validate and convert color between above formats:
	 *
	 * ```javascript
	 * var color = new CKEDITOR.tools.color( 'rgb( 225, 225, 225 )' );
	 * console.log( color.getHex() ); // #FFFFFF
	 *
	 * var color = new CKEDITOR.tools.color( 'red' );
	 * console.log( color.getHexWithAlpha() ); // #FF0000FF
	 * ```
	 * @since 4.16.0
	 * @class
	 */
	CKEDITOR.tools.color = CKEDITOR.tools.createClass( {

		/**
		 * Creates CKEDITOR.tools.color class instance.
		 *
		 * @constructor
		 * @param {String} colorCode
		 * @param {*} defaultValue Value which will be returned by any getter if passed color is not valid.
		 */
		$: function( colorCode, defaultValue ) {
			this._.initialColorCode = colorCode;
			this._.defaultValue = defaultValue;

			this._.parseInput( colorCode );
		},

		proto: {
			/**
			 * Get hexadecimal color representation.
			 *
			 * @returns {String/*} hexadecimal color code (e.g. `#FF00FF`) or default value.
			 */
			getHex: function() {
				var color = blendAlphaColor( this._.red, this._.green, this._.blue, this._.alpha );

				return this._.isValidColor ?
					formatHexString( color[ 0 ], color[ 1 ], color[ 2 ] ) :
					this._.defaultValue;
			},

			/**
			 * Get hexadecimal color representation with separate alpha channel.
			 *
			 * @returns {String/*} hexadecimal color code (e.g. `#FF00FF00`) or default value.
			 */
			getHexWithAlpha: function() {
				return this._.isValidColor ?
					formatHexString( this._.red, this._.green, this._.blue, this._.alpha ) :
					this._.defaultValue;
			},

			/**
			 * Get rgb color representation.
			 *
			 * Each color ranged in 0-255.
			 *
			 * @returns {String/*} rgb color (e.g. `rgb(255,255,255)`) or default value.
			 */
			getRgb: function() {
				var color = blendAlphaColor( this._.red, this._.green, this._.blue, this._.alpha );

				return this._.isValidColor ?
					formatRgbString( 'rgb', color[ 0 ], color[ 1 ], color[ 2 ]  ) :
					this._.defaultValue;
			},

			/**
			 * Get rgb color representation with separate alpha channel.
			 *
			 * Each color ranged in 0-255.
			 * Alpha ranged in 0-1.
			 *
			 * @returns {String/*} rgba color (e.g. `rgba(255,255,255,0)`) or default value.
			 */
			getRgba: function() {
				return this._.isValidColor ?
					formatRgbString( 'rgba', this._.red, this._.green, this._.blue, this._.alpha ) :
					this._.defaultValue;
			},

			/**
			 * Get hsl color representation.
			 *
			 * Hue ranged in 0-360.
			 * Saturation, Lightness ranged in 0-100%.
			 *
			 * @returns {String/*} hsl color (e.g. `hsl(360, 100%, 50%)`) or default value.
			 *
			 */
			getHsl: function() {
				var color = blendAlphaColor( this._.red, this._.green, this._.blue, this._.alpha );

				if ( this._.isValidColor ) {
					var hsl = this._.rgbToHsl( color[0], color[1], color[2] );
					return formatHslString( 'hsl', hsl[0], hsl[1], hsl[2] );
				} else {
					return this._.defaultValue;
				}
			},

			/**
			 * Get hsla color representation with separate alpha channel.
			 *
			 * Hue ranged in 0-360.
			 * Saturation, Lightness ranged in 0-100%.
			 * Alpha ranged in 0-1.
			 *
			 * @returns {String/*} hsla color (e.g. `hsla(360, 100%, 50%, 0)`) or default value.
			 */
			getHsla: function() {
				var hsl = this._.rgbToHsl( this._.red, this._.green, this._.blue );

				return this._.isValidColor ?
					formatHslString( 'hsla', hsl[0], hsl[1], hsl[2], this._.alpha ) :
					this._.defaultValue;
			},

			/**
			 * Get raw value passed to constructor during color object creation.
			 *
			 * @returns {String} Raw value passed during color object creation.
			 */
			getInitialValue: function() {
				return this._.initialColorCode;
			}
		},

		_: {
			/**
			 * Initial color code provided to create object.
			 *
			 * @private
			 * @property {String}
			 */
			initialColorCode: '',

			/**
			 * Whether valid color input was passed.
			 *
			 * @private
			 * @property {Boolean}
			 */
			isValidColor: true,

			/**
			 * Red channel value. Ranges in 0-255.
			 *
			 * @private
			 * @property {Number}
			 */
			red: 0,

			/**
			 * Green channel value. Ranges in 0-255.
			 *
			 * @private
			 * @property {Number}
			 */
			green: 0,

			/**
			 * Blue channel value. Ranges in 0-255.
			 *
			 * @private
			 * @property {Number}
			 */
			blue: 0,

			/**
			 * Alpha channel value. Ranges in 0-1.
			 *
			 * @private
			 * @property {Number}
			 */
			alpha: 1,

			/**
			 * Parses color string trying to match it to any supported format and extract RGBA channels.
			 *
			 * @private
			 * @param {String} colorCode Color to parse.
			 */
			parseInput: function( colorCode ) {
				if ( typeof colorCode !== 'string' ) {
					this._.isValidColor = false;
					return;
				}

				colorCode = colorCode.trim();

				// Check if named color was passed and get its HEX representation.
				var hexFromNamedColor = this._.matchStringToNamedColor( colorCode );
				if ( hexFromNamedColor ) {
					colorCode = hexFromNamedColor;
				}

				var colorChannelsFromHex = this._.extractColorChannelsFromHex( colorCode ),
					colorChannelsFromRgba = this._.extractColorChannelsFromRgba( colorCode ),
					colorChannelsFromHsla = this._.extractColorChannelsFromHsla( colorCode ),
					colorChannels = colorChannelsFromHex || colorChannelsFromRgba || colorChannelsFromHsla;

				if ( !colorChannels ) {
					this._.isValidColor = false;
					return;
				}

				this._.red = colorChannels[ 0 ];
				this._.green = colorChannels[ 1 ];
				this._.blue = colorChannels[ 2 ];
				this._.alpha = colorChannels[ 3 ];
			},

			/**
			 * Get hexadecimal color value based on color name.
			 *
			 * @private
			 * @param {String} colorName color name, e.g. `red`.
			 * @returns {String/null} Hexadecimal color representation or `null` if such named color does not exists.
			 */
			matchStringToNamedColor: function( colorName ) {
				return CKEDITOR.tools.color.namedColors[ colorName.toLowerCase() ] || null;
			},

			/**
			 * Extracts RGBA channels from given HEX string.
			 *
			 * @private
			 * @param {String} colorCode HEX color representation.
			 */
			extractColorChannelsFromHex: function( colorCode ) {
				if ( colorCode.match( CKEDITOR.tools.color.hex3CharsRegExp ) ) {
					colorCode = this._.hex3ToHex6( colorCode );
				}

				if ( colorCode.match( CKEDITOR.tools.color.hex6CharsRegExp ) || colorCode.match( CKEDITOR.tools.color.hex8CharsRegExp ) ) {
					var parts = colorCode.split( '' );

					return [
						hexToValue( parts[ 1 ] + parts[ 2 ] ),
						hexToValue( parts[ 3 ] + parts[ 4 ] ),
						hexToValue( parts[ 5 ] + parts [ 6 ] ),
						parts[ 7 ] && parts[ 8 ] ? hexToValue( parts[ 7 ] + parts[ 8 ] ) : 1
					];
				}

				return null;
			},

			/**
			 * Extracts RGBA channels from given RGBA string.
			 *
			 * @private
			 * @param {String} colorCode RGB or RGBA color representation.
			 */
			extractColorChannelsFromRgba: function( colorCode ) {
				var rgbMatch = colorCode.match( CKEDITOR.tools.color.rgbRegExp );
				if ( colorCode.indexOf( 'rgb' ) === 0 && rgbMatch ) {
					var rgb = this._.normalizeRgbValues( rgbMatch[0], rgbMatch[1], rgbMatch[2] );

					var alpha = rgbMatch.length === 4 ? normalizePercentValue( rgbMatch[3] ) : 1;

					rgb.push( alpha );
					return rgb;
				}

				return null;
			},

			/**
			 * Extract RGBA channels from given HSLA string.
			 *
			 * @private
			 * @param {String} colorCode HSL or HSLA color representation.
			 */
			extractColorChannelsFromHsla: function( colorCode ) {
				var hslMatch = colorCode.match( CKEDITOR.tools.color.rgbRegExp );
				if ( colorCode.indexOf( 'hsl' ) === 0 && hslMatch ) {
					var rgb = this._.hslToRgb( hslMatch[0],hslMatch[1], hslMatch[2] );
					var alpha = hslMatch.length === 4 ? normalizePercentValue( hslMatch[3] ) : 1;

					rgb.push( alpha );
					return rgb;
				}

				return null;
			},

			/**
			 * Convert 3-characters hexadecimal color format to 6-characters one.
			 *
			 * @private
			 * @param {String} hex3ColorCode 3-characters hexadecimal color, e.g. `#F0F`.
			 * @returns {String} 6-characters hexadecimal color e.g. `#FF00FF`.
			 */
			hex3ToHex6: function( hex3ColorCode ) {
				var parts = hex3ColorCode.split( '' );

				return '#' + parts[ 1 ] + parts[ 1 ] + parts[ 2 ] + parts[ 2 ] + parts[ 3 ] + parts[ 3 ];
			},

			/**
			 * Normalize rgb values into 0-255 range.
			 *
			 * @private
			 * @param {Number} red Number of red channel.
			 * @param {Number} green Number of green channel.
			 * @param {Number} blue Number of blue channel.
			 * @returns {Array} Rgb Array of normalized values.
			 */
			normalizeRgbValues: function( red, green, blue ) {
				function normalizer( number ) {
					if ( isPercentValue( number ) ) {
						number = convertPercentValueToNumber( number );
						number = Math.round( 255 * normalizePercentValue( number ) );
					} else {
						number = Number( number );
						number = number > 255 ? 0 :
							number < 0 ? 255 : number;
					}
					return number;
				}
				red = normalizer( red );
				green = normalizer( green );
				blue = normalizer( blue );

				return [ red, green, blue ];
			},

			/**
			 * Convert rgb color values to hsl color values.
			 *
			 * @private
			 * @param {Number} red Number of red channel.
			 * @param {Number} green Number of green channel.
			 * @param {Number} blue Number of blue channel.
			 * @returns {Array} Array of hsl values.
			 */
			rgbToHsl: function( red, green, blue ) {
				//Based on https://en.wikipedia.org/wiki/HSL_and_HSV#General_approach
				var r = red / 255,
					g = green / 255,
					b = blue / 255;

				var Max = Math.max( r, g, b ),
					min = Math.min( r, g, b ),
					Chroma = Max - min;

				var calculateHueFactor = function() {
					switch ( Max ) {
						case r:
							return ( ( g - b ) / Chroma ) % 6;
						case g:
							return ( ( b - r ) / Chroma ) + 2;
						case b:
							return ( ( r - g ) / Chroma ) + 4;
					}
				};

				var hFactor = calculateHueFactor();
				var hue = Chroma === 0 ? 0 : 60 * hFactor;

				var light = ( Max + min ) / 2;

				var saturation = 1;
				if ( light === 1 || light === 0 ) {
					saturation = 0;
				} else {
					saturation = Chroma / ( 1 - Math.abs( ( 2 * light ) - 1 ) );
				}

				hue = Math.round( hue );
				saturation = Math.round( saturation ) * 100;
				light = light * 100;

				var hsl = [ hue, saturation, light ];
				return hsl;
			},

			/**
			 * Convert hsl values into rgb.
			 *
			 * @private
			 * @param {Number} hue
			 * @param {Number} saturation
			 * @param {Number} lightness
			 * @returns {Array} Array of decimal rgb values.
			 */
			hslToRgb: function( hue, saturation, lightness ) {
				//Based on https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
				hue = clampValueInRange( Number( hue ), 0, 360 ),
				saturation = normalizePercentValue( saturation ),
				lightness = normalizePercentValue( lightness );

				var calculateValueFromConst = function( fixValue ) {
					var k = ( fixValue + ( hue / 30 ) ) % 12,
						a = saturation * Math.min( lightness, 1 - lightness );

					var min = Math.min( k - 3, 9 - k, 1 ),
						max = Math.max( -1, min ),
						normalizedValue = lightness - ( a * max );

					return Math.round( normalizedValue * 255 );
				};

				var rgb = [ calculateValueFromConst( 0 ), calculateValueFromConst( 8 ), calculateValueFromConst( 4 ) ];
				return rgb;
			}
		},
		statics: {
			/**
			 * Regular expression to match three characters long hexadecimal color value.
			 *
			 * @private
			 * @static
			 * @property {RegExp}
			 */
			hex3CharsRegExp: /#([0-9a-f]{3}$)/gim,

			/**
			 * Regular expression to match six characters long hexadecimal color value.
			 *
			 * @private
			 * @static
			 * @property {RegExp}
			 */
			hex6CharsRegExp: /#([0-9a-f]{6}$)/gim,

			/**
			 * Regular expression to match eight characters long hexadecimal color value.
			 *
			 * @private
			 * @static
			 * @property {RegExp}
			 */
			hex8CharsRegExp: /#([0-9a-f]{8}$)/gim,

			/**
			 * Regular expression to extract numbers from rgba / hsla color value.
			 * @private
			 * @static
			 * @property {RegExp}
			 */
			rgbRegExp: /\d+\.?\d*%*/g,

			/** Color list based on [W3.org](https://www.w3.org/TR/css-color-4/#named-colors).
			 *
			 * @static
			 * @member CKEDITOR.tools.color
			 * @property {Object}
			 */
			namedColors: {
				aliceblue: '#F0F8FF',
				antiquewhite: '#FAEBD7',
				aqua: '#00FFFF',
				aquamarine: '#7FFFD4',
				azure: '#F0FFFF',
				beige: '#F5F5DC',
				bisque: '#FFE4C4',
				black: '#000000',
				blanchedalmond: '#FFEBCD',
				blue: '#0000FF',
				blueviolet: '#8A2BE2',
				brown: '#A52A2A',
				burlywood: '#DEB887',
				cadetblue: '#5F9EA0',
				chartreuse: '#7FFF00',
				chocolate: '#D2691E',
				coral: '#FF7F50',
				cornflowerblue: '#6495ED',
				cornsilk: '#FFF8DC',
				crimson: '#DC143C',
				cyan: '#00FFFF',
				darkblue: '#00008B',
				darkcyan: '#008B8B',
				darkgoldenrod: '#B8860B',
				darkgray: '#A9A9A9',
				darkgreen: '#006400',
				darkgrey: '#A9A9A9',
				darkkhaki: '#BDB76B',
				darkmagenta: '#8B008B',
				darkolivegreen: '#556B2F',
				darkorange: '#FF8C00',
				darkorchid: '#9932CC',
				darkred: '#8B0000',
				darksalmon: '#E9967A',
				darkseagreen: '#8FBC8F',
				darkslateblue: '#483D8B',
				darkslategray: '#2F4F4F',
				darkslategrey: '#2F4F4F',
				darkturquoise: '#00CED1',
				darkviolet: '#9400D3',
				deeppink: '#FF1493',
				deepskyblue: '#00BFFF',
				dimgray: '#696969',
				dimgrey: '#696969',
				dodgerblue: '#1E90FF',
				firebrick: '#B22222',
				floralwhite: '#FFFAF0',
				forestgreen: '#228B22',
				fuchsia: '#FF00FF',
				gainsboro: '#DCDCDC',
				ghostwhite: '#F8F8FF',
				gold: '#FFD700',
				goldenrod: '#DAA520',
				gray: '#808080',
				green: '#008000',
				greenyellow: '#ADFF2F',
				grey: '#808080',
				honeydew: '#F0FFF0',
				hotpink: '#FF69B4',
				indianred: '#CD5C5C',
				indigo: '#4B0082',
				ivory: '#FFFFF0',
				khaki: '#F0E68C',
				lavender: '#E6E6FA',
				lavenderblush: '#FFF0F5',
				lawngreen: '#7CFC00',
				lemonchiffon: '#FFFACD',
				lightblue: '#ADD8E6',
				lightcoral: '#F08080',
				lightcyan: '#E0FFFF',
				lightgoldenrodyellow: '#FAFAD2',
				lightgray: '#D3D3D3',
				lightgreen: '#90EE90',
				lightgrey: '#D3D3D3',
				lightpink: '#FFB6C1',
				lightsalmon: '#FFA07A',
				lightseagreen: '#20B2AA',
				lightskyblue: '#87CEFA',
				lightslategray: '#778899',
				lightslategrey: '#778899',
				lightsteelblue: '#B0C4DE',
				lightyellow: '#FFFFE0',
				lime: '#00FF00',
				limegreen: '#32CD32',
				linen: '#FAF0E6',
				magenta: '#FF00FF',
				maroon: '#800000',
				mediumaquamarine: '#66CDAA',
				mediumblue: '#0000CD',
				mediumorchid: '#BA55D3',
				mediumpurple: '#9370DB',
				mediumseagreen: '#3CB371',
				mediumslateblue: '#7B68EE',
				mediumspringgreen: '#00FA9A',
				mediumturquoise: '#48D1CC',
				mediumvioletred: '#C71585',
				midnightblue: '#191970',
				mintcream: '#F5FFFA',
				mistyrose: '#FFE4E1',
				moccasin: '#FFE4B5',
				navajowhite: '#FFDEAD',
				navy: '#000080',
				oldlace: '#FDF5E6',
				olive: '#808000',
				olivedrab: '#6B8E23',
				orange: '#FFA500',
				orangered: '#FF4500',
				orchid: '#DA70D6',
				palegoldenrod: '#EEE8AA',
				palegreen: '#98FB98',
				paleturquoise: '#AFEEEE',
				palevioletred: '#DB7093',
				papayawhip: '#FFEFD5',
				peachpuff: '#FFDAB9',
				peru: '#CD853F',
				pink: '#FFC0CB',
				plum: '#DDA0DD',
				powderblue: '#B0E0E6',
				purple: '#800080',
				rebeccapurple: '#663399',
				red: '#FF0000',
				rosybrown: '#BC8F8F',
				royalblue: '#4169E1',
				saddlebrown: '#8B4513',
				salmon: '#FA8072',
				sandybrown: '#F4A460',
				seagreen: '#2E8B57',
				seashell: '#FFF5EE',
				sienna: '#A0522D',
				silver: '#C0C0C0',
				skyblue: '#87CEEB',
				slateblue: '#6A5ACD',
				slategray: '#708090',
				slategrey: '#708090',
				snow: '#FFFAFA',
				springgreen: '#00FF7F',
				steelblue: '#4682B4',
				tan: '#D2B48C',
				teal: '#008080',
				thistle: '#D8BFD8',
				tomato: '#FF6347',
				turquoise: '#40E0D0',
				violet: '#EE82EE',
				windowtext: 'windowtext',
				wheat: '#F5DEB3',
				white: '#FFFFFF',
				whitesmoke: '#F5F5F5',
				yellow: '#FFFF00',
				yellowgreen: '#9ACD32'
			}
		}
	} );

	/**
	 * Color list based on https://www.w3.org/TR/css-color-4/#named-colors.
	 * @member CKEDITOR.tools.style.parse
	 *
	 * @private
	 * @deprecated
	 */
	CKEDITOR.tools.style.parse._colors = CKEDITOR.tools.color.namedColors;

	// Blends alpha into RGB color channels. Assumes that background is white.
	//
	// @private
	// @param {Number} red Red channel value.
	// @param {Number} green Green channel value.
	// @param {Number} blue Blue channel value.
	// @param {Number} alpha Alpha channel value.
	// @returns {Array} Array containing RGB channels with alpha mixed.
	function blendAlphaColor( red, green, blue, alpha ) {
		// Based on https://en.wikipedia.org/wiki/Alpha_compositing.
		return CKEDITOR.tools.array.map( [ red, green, blue ], function( color ) {
			return Math.round( 255 - alpha * ( 255 - color ) );
		} );
	}

	function clampValueInRange( value, min, max ) {
		return Math.min( Math.max( value, min ), max );
	}

	// Convert value into Number ranged in 0-100.
	// @param {String/Number} value.
	function normalizePercentValue( value ) {
		if ( isPercentValue( value ) ) {
			value = convertPercentValueToNumber( value );
		}

		if ( Math.abs( value ) > 1 ) {
			value =  value / 100;
		}

		return clampValueInRange( value, 0, 1 );
	}

	// Validate if given value is string type and ends with `%` character.
	// @param {*} value any value.
	// @returns {Boolean}
	function isPercentValue( value ) {
		return typeof value === 'string' && value.slice( -1 ) === '%';
	}

	// Remove `%` character and convert value to Number.
	// @param {String} value Percent value (e.g. `100%`)
	// @returns {Number} value as a Number.
	function convertPercentValueToNumber( value ) {
		return Number( value.slice( 0, -1 ) );
	}

	// Convert given value as hexadecimal based.
	// @param {*} value value to convert.
	// @returns {String} hexadecimal value.
	function valueToHex( value ) {
		var hex = value.toString( 16 );

		return hex.length == 1 ? '0' + hex : hex;
	}

	// Convert hexadecimal value to digit.
	function hexToValue( hexValue ) {
		return parseInt( hexValue, 16 );
	}

	//Format rgb to hex
	function formatHexString( red, green, blue, alpha ) {
		var hexColorCode = '#' + valueToHex( red ) + valueToHex( green ) + valueToHex( blue );

		if ( alpha !== undefined ) {
			hexColorCode += valueToHex( alpha );
		}

		return hexColorCode.toUpperCase();
	}

	// Convert color values into formatted rgb or rgba color code.
	// @param {*} rgbPrefix
	// @param {*} red
	// @param {*} green
	// @param {*} blue
	// @param {*} alpha
	// @returns {String} Formatted color value (e.g. `rgb(255,255,255)`)
	function formatRgbString( rgbPrefix, red, green, blue, alpha ) {
		var rgba = [ red, green, blue ];

		if ( alpha !== undefined ) {
			rgba.push( alpha );
		}

		return rgbPrefix + '(' + rgba.join( ',' ) + ')';
	}

	// Convert color values into formatted hsl or hsla color code.
	// @private
	// @param {String} hslPrefix Prefix for color value. Expected `hsl` or `hsla`.
	// @param {*} hue
	// @param {*} saturation
	// @param {*} lightness
	// @param {*} alpha
	// @returns {String} Formatted color value (e.g. `hsl(360, 50%, 50%)`)
	function formatHslString( hslPrefix, hue, saturation, lightness, alpha ) {
		var alphaString = alpha !== undefined ? ',' + alpha : '';

		return hslPrefix + '(' +
		hue + ',' +
		saturation + '%,' +
		lightness + '%' +
		alphaString +
		')';
	}

} )();
