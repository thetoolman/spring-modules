/*
 * Copyright 2004-2005 the original author or authors.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Oliver Hutchison
 * @author Toolman
 */


/******************************************************************************
* 
* Core validation object.
* 
******************************************************************************/
var ValangValidator = function(name, installSelfWithForm, rules) {
    this.name = name;
    this.rules = rules;
    this.form = this._findForm(name);
    
    //create grouped rules by field
    this.groupedRules = {};
    for (var i = 0; i < this.rules.length; i++) {
    	var ruleField = this.rules[i].field;
    	var fieldArray = this.groupedRules[ruleField];
    	
    	if(!fieldArray) {
    		this.groupedRules[ruleField] = new Array();
    		fieldArray = this.groupedRules[ruleField];
    	}
    	fieldArray.push(this.rules[i]);
    }
    
    if (installSelfWithForm) {
        this._installSelfWithForm();
    }
};

ValangValidator.prototype = {
	globalErrorsId: 'global_errors',
	fieldErrorIdSuffix: '_error',
    classRuleFieldName: "valang-global-rules", // matches CommandObjectToValangConverter.CLASS_RULENAME

    // check all fields and global checks, returns boolean form valid state 
    validate: function() { 
    	var isValid = true;
        for(i in this.groupedRules) {
        	var rules = this.groupedRules[i];
        	if(rules && rules.length > 0) {
        		var thisFields = this.form.getFieldsWithName(rules[0].field);
        		for (var j = 0; j < thisFields.length; j++) {
        			isValid = this.validateField(thisFields[j]) && isValid;
        		}
        	}
        }
        ValangValidator.Logger.log('Is form valid? ' + isValid);
    	
        return isValid;
    },

	
    //checks all rules on a field, updates error message and fires callback
    validateField: function(field) {
        ValangValidator.Logger.push('Evaluating ' + field.name + ' rules');

        this._clearErrorIfExists(field.name);
        var isValid = true;
        var fieldRules = this.groupedRules[field.name];
        var errorRules = new Array();
        
        if(!fieldRules || fieldRules.length == 0){
        	ValangValidator.Logger.pop('No rules');
        	return isValid;
        }
        
        for (var i = 0; i < fieldRules.length; i++) {
            var rule = fieldRules[i];
            rule.form = this.form;
            var thisValid = false;
            try {
            	thisValid =  rule.validate();
            } catch(err) {
            	ValangValidator.Logger.log("Rule error: " + err);
            }
            isValid = isValid && thisValid;
            if(!thisValid) {
            	errorRules.push(rule);
            }
            ValangValidator.Logger.log(thisValid ? 'Passed' : 'Failed');
        }

        var errorBox = document.getElementById(field.name + this.fieldErrorIdSuffix);
        if( errorRules.length > 0) {
        	//inject first error only
        	if( errorBox != null) {
        		errorBox.innerHTML = errorRules[0].getErrorMessage();
        	} else {
	        	alert(field.name + " : " + errorRules[0].getErrorMessage());
	        	ValangValidator.Logger.log("error node not found.");
        	}
        }
        
		if(this.fieldValidationCallback) {
        	ValangValidator.Logger.log("Field callback.");
			this.fieldValidationCallback(field.fieldElement, isValid, fieldRules.length);
		}
        
        ValangValidator.Logger.pop('Finished field rules evaluation');
        return isValid;
    },    
    
    _installSelfWithForm: function() {
    	var thisValidator = this;
    	
        var oldOnload = window.onload;
        var oldOnsubmit = this.form.formElement.onsubmit;

        //onload - bind to onblurs
        window.onload = function() {
            ValangValidator.Logger.log('Installing ValangValidator \'' 
            		+ thisValidator.name + '\' as onsubmit handler');
            try {
                if (oldOnload) {
                    oldOnload();
                }
            } catch (err) {
            	ValangValidator.Logger.log('other onload error: ' + err);
            }
            	
        	// onblur for each field
        	var fields = thisValidator.form.getFields();
        	for ( var i = 0; i < fields.length; i++) {
				var thisField = fields[i];
				if(thisField.type == "submit") continue; //dont add to submit buttons
				
				thisField.fieldElement._oldBlur = thisField.fieldElement.blur;
        		thisField.fieldElement.onblur = function() {
        			// fire any old onblur
        			if(this._oldBlur) {
        	            ValangValidator.Logger.push('Calling OldBlur');
        				this._oldBlur();
        	            ValangValidator.Logger.pop('End OldBlur');
        			}
        			// check this field
        			var vField =  new ValangValidator.Field(this);
    				thisValidator.validateField(vField);
        		};
			}
        	
        	// on submit
        	thisValidator.form.formElement.onsubmit = function() {

        		if (!oldOnsubmit || oldOnsubmit()) {
        			
                	var isValid = thisValidator.validate();
                	
                	var callbackVal = false;
        			if(thisValidator.formValidationCallback) {
        				callbackVal = thisValidator.formValidationCallback(this, isValid);
        			}

        			return callbackVal || isValid;
                }
        		return false;
            }
        }
    },
    
    _findForm: function(name) {
        var element = document.getElementById(name);
        if (!element || element.tagName.toLowerCase() != 'form') {
            element = document.getElementById(name + 'ValangValidator');
	        if (!element || element.tagName.toLowerCase() != 'script') {
	        	throw 'unable to find form with ID \'' + name + '\' or script element with ID \'' 
	        		+ name + 'ValangValidator\'';
	        }
        }
        var foundElement = element;
        while (element && element.tagName.toLowerCase() != 'form') {
            element = element.parentNode;
        }
        if (!element) {
            throw 'unable to find FORM element enclosing element with ID \'' + foundElement.id + '\'';
        }
        return new ValangValidator.Form(element);
    },
    
    _clearErrorIfExists: function(field) {
        var errorBox = document.getElementById(field + this.fieldErrorIdSuffix);
        if (errorBox != null) {
            errorBox.innerHTML = '';
        }
    },
    
    _clearGlobalErrors: function() {
        var errorBox = document.getElementById(this.globalErrorsId);
        if (errorBox != null) {
            errorBox.innerHTML = '';
        }
    },
    
    _giveRulesSameOrderAsFormFields: function(failedRules) {
        var sortedFailedRules = new Array();
        var fields = this.form.getFields();
        for (var i = 0; i < fields.length; i++) {
            var fieldName = fields[i].name;
            for (var j = 0; j < failedRules.length; j++) {
                if (failedRules[j] && failedRules[j].field == fieldName) {
                    sortedFailedRules.push(failedRules[j]);
                    failedRules[j] = null;
                }
            }
        }
        for (var i = 0; i < failedRules.length; i++) {
            if (failedRules[i]) {
                sortedFailedRules.push(failedRules[i]);
            }
        }
        return sortedFailedRules;
    },
    
    // stubs
    fieldValidationCallback: function(field, isValid, ruleCount) {
        ValangValidator.Logger.log('Stub callback: ' + field + " : " + isValid + " : " + ruleCount);
    },
    
    formValidationCallback: function(form, isValid) {
        ValangValidator.Logger.log('Stub callback: ' + form + " : " + isValid);
        return isValid;
    }
};



/******************************************************************************
 * 
 * Encapsulates the HTML form
 *
 * Based on code from http://prototype.conio.net/
 * 
 ******************************************************************************/

ValangValidator.Form = function(formElement) {
    this.formElement = formElement;
};

ValangValidator.Form.prototype = {
    getValue: function(fieldName) {
        var fields = this.getFieldsWithName(fieldName);
        var value = new Array();
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].getValue()) {
                value.push(fields[i].getValue());
            }
        }
        if (value.length == 1) {
            return value[0];
        } else if (value.length > 1) {
            return value;
        }
    },
    getFieldsWithName: function(fieldName) {
        var matchingFields = new Array();
        var fields = this.getFields();
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field.name == fieldName) {
                matchingFields.push(field);
            }
        }
        return matchingFields;
    },
    getFields: function() {
        var fields = new Array();
        var tagElements = this.formElement.elements;
        for (var i = 0; i < tagElements.length; i++) {
        	
        	if(tagElements[i].nodeName == "FIELDSET") continue;
        	if(tagElements[i].nodeName == "BUTTON") continue;
        	
            fields.push(new ValangValidator.Field(tagElements[i]));
        }
        return fields;
    },
    disable: function() {
        var fields = this.getFields();
        for (var i = 0; i < fields.length; i++) {
            fields[i].disable();
        }
    },
    enable: function() {
        var fields = this.getFields();
        for (var i = 0; i < fields.length; i++) {
            fields[i].enable();
        }
    },
    focusFirstElement: function(form) {
        var fields = this.getFields();
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field.type != 'hidden' && !field.isDisabled()) {
                field.activate();
                break;
            }
        }
    }
};


/******************************************************************************
 * 
 * Encapsulates a HTML form field
 *
 * Based on code from http://prototype.conio.net/
 * 
 ******************************************************************************/
ValangValidator.Field = function(fieldElement) {
    this.id = fieldElement.id;
    this.name = fieldElement.name;
    this.type = fieldElement.type.toLowerCase();
    this.tagName = fieldElement.tagName.toLowerCase();
    this.fieldElement = fieldElement;   
    
    if (ValangValidator.Field.ValueGetters[this.tagName]) {
        this.getValue = ValangValidator.Field.ValueGetters[this.tagName];
        
    } else if (this.tagName == 'input') {
        switch (this.type) {
            case 'submit':
            case 'hidden':
            case 'password':
            case 'text':
                this.getValue = ValangValidator.Field.ValueGetters['textarea'];
                break;
            case 'checkbox':
            case 'radio':
                this.getValue = ValangValidator.Field.ValueGetters['inputSelector'];
                break;
            default:
                throw 'unexpected input field type \'' + this.type + '\'';
        }
    } else {
        throw 'unexpected form field tag name \'' + this.tagName + '\'';
    }
};


ValangValidator.Field.prototype = {
    clear: function() {
        this.fieldElement.value = '';
    },
    focus: function() {
        // The following line is sometimes effected by Firefox Bug 236791. 
        // https://bugzilla.mozilla.org/show_bug.cgi?id=236791
        this.fieldElement.focus();
    },
    select: function() {
        if (this.fieldElement.select) {
            this.fieldElement.select();
        }
    },
    activate: function() {
        this.focus();
        this.select();
    },
    isDisabled : function() {
        return element.disabled;
    },
    disable: function() {
        element.blur();
        element.disabled = 'true';
    },
    enable: function() {
        element.disabled = '';
    }
};

ValangValidator.Field.ValueGetters = {
    inputSelector: function() {
        if (this.fieldElement.checked) {
            return this.fieldElement.value;
        }
    },
    textarea: function() {
        return this.fieldElement.value;
    },
    select: function() {
        var value = '';
        if (this.fieldElement.type == 'select-one') {
            var index = this.fieldElement.selectedIndex;
            if (index >= 0) {
                value = this.fieldElement.options[index].value;
            }
        } else {
            value = new Array();
            for (var i = 0; i < element.length; i++) {
                var option = this.fieldElement.options[i];
                if (option.selected) {
                    value.push(option.value);
                }
            }
        }
        return value;
    }
};

/******************************************************************************
 * 
 * Represents a single valang rule and the functions needed to evaluate that rule.
 * 
 ******************************************************************************/

ValangValidator.Rule = function(field, valang, errorMessage, validationFunction) {
    this.field = field;
    this.valang = valang;
    this.errorMessage = errorMessage;
    this.validate = validationFunction;
}

ValangValidator.Rule.prototype = {
    getErrorMessage: function() {
        return this.errorMessage;
    },

    // 	Property Accessor
    getPropertyValue: function(propertyName, expectedType) {
        return this.form.getValue(propertyName);
    },

    // 	Assertions
    _assertHasLength: function(value) {
        if (!value.length) {
            throw 'value \'' + value + '\' does not have length';
        }
    },
    _assertLength: function(value, length) {
        this._assertHasLength(value);
        if (value.length != length) {
            throw 'value\'s length != \'' + length + '\'';
        }
    },
    _throwError: function(msg) {
        throw msg;
    },

	// Type safety checks
	/* This function tries to convert the lhs into a type
		that are compatible with the rhs for the various
		JS compare operations. When there is a choice between
		converting to a string or a number; number is always
		favoured. */
	_makeCompatible: function(lhs, rhs) {
        try {
            this._forceNumber(rhs);
            return this._forceNumber(lhs);
        } catch(ex) {
        }
        var lhsType = typeof lhs;
        var rhsType = typeof rhs;
        if (lhsType == rhsType) {
            return lhs;
        } else if (lhsType == 'number' || rhsType == 'number') {
            return this._forceNumber(lhs);
        } else {
            throw 'unable to convert [' + lhs + '] and [' + rhs + '] to compatible types';
        }
    },
    _forceNumber: function(value) {
        if (value.constructor.toString().match(/date/i)) { //is a date
        	return value.getTime();
        }
        else if (typeof value != 'number') {
            try {
                var newValue = eval(value.toString());
            } catch(ex) {
            }
            if (newValue && typeof newValue == 'number') {
                return newValue;
            }
            throw 'unable to convert value [' + value + '] to number';
        }
        return value;
    },

    // Unary Operators
    lengthOf: function(value) {
        return (value != null) ? value.length : 0;
    },
    lowerCase: function(value) {
        return (value != null) ? value.toLowerCase(): null;
    },
    upperCase: function(value) {
        return (value != null) ? value.toUpperCase(): null;
    },

    // Binary Operators
    equals: function(lhs, rhs) {
        if ((lhs == null && rhs != null) || (rhs == null && lhs != null)) {
            return false;
        }
        if (lhs == rhs) {
            return true;
        }
        lhs = this._makeCompatible(lhs, rhs);
        rhs = this._makeCompatible(rhs, lhs);
        return lhs === rhs;
    },
    lessThan: function(lhs, rhs) {
        lhs = this._makeCompatible(lhs, rhs);
        rhs = this._makeCompatible(rhs, lhs);
        return lhs < rhs;
    },
    lessThanOrEquals: function(lhs, rhs) {
        lhs = this._makeCompatible(lhs, rhs);
        rhs = this._makeCompatible(rhs, lhs);
        return lhs <= rhs;
    },
    moreThan: function(lhs, rhs) {
        lhs = this._makeCompatible(lhs, rhs);
        rhs = this._makeCompatible(rhs, lhs);
        return lhs > rhs;
    },
    moreThanOrEquals: function(lhs, rhs) {
        lhs = this._makeCompatible(lhs, rhs);
        rhs = this._makeCompatible(rhs, lhs);
        return lhs >= rhs;
    },
    inFunc: function(lhs, rhs) {
        for (var i = 0; i < rhs.length; i++) {
            var value = rhs[i];
            if (lhs == value) {
                return true;
            }
        }
        return false;
    },
    between: function(lhs, rhs) {
        this._assertLength(rhs, 2);
        lhs = this._makeCompatible(lhs, rhs[0]);
        rhs[0] = this._makeCompatible(rhs[0], lhs);
        rhs[1] = this._makeCompatible(rhs[1], lhs);
        return lhs >= rhs[0] && lhs <= rhs[1];
    },
    nullFunc: function(lhs, rhs) {
        return lhs === null || typeof lhs == 'undefined';
    },
    hasText: function(lhs, rhs) {
        return lhs && lhs.replace(/\s/g, '').length > 0;
    },
    hasLength: function(lhs, rhs) {
        return lhs && lhs.length > 0;
    },
    isBlank: function(lhs, rhs) {
        return !lhs || lhs.length === 0;
    },
    isWord: function(lhs, rhs) {
        return lhs && lhs.replace(/\s/g, '') == lhs;
    },
    isUpper: function(lhs, rhs) {
        return lhs && lhs.toUpperCase() == lhs;
    },
    isLower: function(lhs, rhs) {
        return lhs && lhs.toLowerCase() == lhs;
    },

    // Math operators
    add: function(lhs, rhs) {
        return this._forceNumber(lhs) + this._forceNumber(rhs);
    },
    divide: function(lhs, rhs) {
        return this._forceNumber(lhs) / this._forceNumber(rhs);
    },
    modulo: function(lhs, rhs) {
        return this._forceNumber(lhs) % this._forceNumber(rhs);
    },
    multiply: function(lhs, rhs) {
        return this._forceNumber(lhs) * this._forceNumber(rhs);
    },
    subtract: function(lhs, rhs) {
        return this._forceNumber(lhs) - this._forceNumber(rhs);
    },

    // Custom Function
    RegExFunction: function(pattern, value) {
        if (!value.match) {
            throw 'don\'t know how to apply regexp to value \'' + value + '\'';
        }
        var matches = value.match(pattern); 
        return (matches != null && matches[0] == value);
    },
    EmailFunction: function(value) {
        var filter = /^(([A-Za-z0-9]+_+)|([A-Za-z0-9]+\-+)|([A-Za-z0-9]+\.+)|([A-Za-z0-9]+\++))*[A-Za-z0-9]+@((\w+\-+)|(\w+\.))*\w{1,63}\.[a-zA-Z]{2,6}$/;
        return filter.test(value);
    },
    /*
     * This is the default parseDate implementation: you probably want 
     * to override it with a converter that knows your format, 
     * the standard JS one is not very smart.
     */
    parseDate: function(dateString, fieldName) {
    	var theDate = new Date(Date.parse(dateString));
    	ValangValidator.Logger.log("Using internal date parser: " + 
    			fieldName + ": " + dateString + " -> " + theDate);
    	return theDate;
    }
    
};

/******************************************************************************
 * 
 * Simple static logger implementation; logs output to logId as listed below
 * overide the variable for a new location
 * 
 *****************************************************************************/

ValangValidator.Logger = {
	logId: 'valangLogDiv',
    log: function(msg) {
		if(console) console.log(msg);
		if(! this._logAvailable()) return;
		var msgLi = document.createElement("li");
    	msgLi.appendChild(document.createTextNode(msg));
    	this._logElement.appendChild(msgLi);
    },
    push: function(msg) {
    	this.log(msg);
		if(! this._logAvailable()) return;
		var logElem = document.createElement("ul");
		this._logElement.appendChild(logElem);
		this._logElement = logElem;
    },
    pop: function(msg) {
    	this.log(msg);
    	if(! this._logAvailable()) return;
    	var parent = this._logElement.parentNode;
    	if (parent && parent.nodeName == "UL"){ //check for over-pop!
    		this._logElement = parent;
    	}
    },
    _logElement: null,
    _logAvailableFlag: null,
    _logAvailable: function() {
    	if(this._logAvailableFlag == null) { //first call, setup
			var logDiv = document.getElementById(this.logId);
			if(logDiv){
				var logElem = document.createElement("ul");
				logDiv.appendChild(logElem);
				this._logElement = logElem;
			}
			this._logAvailableFlag = (logDiv != null);
    	}
    	return this._logAvailableFlag;
    	
    	
    },
    _retrieveLogElement: function() {
    	var logDiv = document.getElementById(this.logId);
    	if(!logDiv) return; 
    	
    	if(this._logElement == null) {
    		var logElem = document.createElement("ul");
    		logDiv.appendChild(logElem);
    		this._logElement = logElem;
    	}
    }
};

/******************************************************************************
 * 
 * utility add-ons: push
 * 
 ******************************************************************************/

if (!Array.prototype.push) {
    // Based on code from http://prototype.conio.net/
    Array.prototype.push = function() {
        var startLength = this.length;
        for (var i = 0; i < arguments.length; i++) {
            this[startLength + i] = arguments[i];
        }
        return this.length;
    }
}


