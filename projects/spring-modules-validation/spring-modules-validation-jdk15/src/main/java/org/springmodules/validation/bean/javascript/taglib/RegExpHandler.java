package org.springmodules.validation.bean.javascript.taglib;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;

import org.springframework.context.support.MessageSourceAccessor;
import org.springmodules.validation.bean.conf.loader.annotation.handler.RegExp;

public class RegExpHandler extends Handler {

    public RegExpHandler() {
        super(RegExp.class);
    }

    @Override
    public String convertToValang(Field field, Annotation a, MessageSourceAccessor messages) {
        RegExp annotation = (RegExp) a;

        String name = field.getName();
        String errMsg = messages.getMessage(annotation.errorCode(), annotation.message());
        StringBuffer sb = new StringBuffer();

        // function() {return this.equals((this.RegExFunction(
        // '[a-z]*'
        // ,this.getPropertyValue(
        // 'testNull'
        // ))), (true))}
        sb.append(" function() {return this.equals((this.RegExFunction(");
        sb.append(wrapAndEscapeJsString(annotation.value())); // regex
        sb.append(",this.getPropertyValue(");
        sb.append(wrapAndEscapeJsString(name)); // value name
        sb.append("))), (true))}");

        return buildBasicRule(name, errMsg, sb.toString(), a);
    }
}