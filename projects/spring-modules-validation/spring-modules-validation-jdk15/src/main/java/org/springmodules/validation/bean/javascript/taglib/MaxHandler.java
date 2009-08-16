package org.springmodules.validation.bean.javascript.taglib;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;

import org.springframework.context.support.MessageSourceAccessor;
import org.springmodules.validation.bean.conf.loader.annotation.handler.Max;

public class MaxHandler extends Handler {

    public MaxHandler() {
        super(Max.class);
    }

    @Override
    public String convertToValang(Field field, Annotation a, MessageSourceAccessor messages) {
        Max annotation = (Max) a;

        String name = field.getName();
        String errMsg = messages.getMessage(annotation.errorCode(), annotation.message());

        StringBuffer sb = new StringBuffer();
        sb.append(" function() {return this.lessThanOrEquals((this.getPropertyValue(");
        sb.append(wrapAndEscapeJsString(name));// field
        sb.append(")), (");
        sb.append(annotation.value());
        sb.append("))}");

        return buildBasicRule(name, errMsg, sb.toString(), annotation);
    }

}