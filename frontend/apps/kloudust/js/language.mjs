/* 
 * (C) 2015 TekMonks. All rights reserved.
 * License: See enclosed license.txt file.
 */

function changeLanguage(lang) {
	$$.libsession.set($$.MONKSHU_CONSTANTS.LANG_ID, lang);
	$$.librouter.reload(); 
}

export const language = {changeLanguage};