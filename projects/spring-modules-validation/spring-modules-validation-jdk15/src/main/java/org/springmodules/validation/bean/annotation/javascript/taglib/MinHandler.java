package org.springmodules.validation.bean.annotation.javascript.taglib;

import java.lang.annotation.Annotation;

import org.springframework.context.support.MessageSourceAccessor;
import org.springmodules.validation.bean.conf.loader.annotation.handler.Min;

public class MinHandler extends Handler {

    public MinHandler() {
        super(Min.class);
    }

    @Override
    public String convertToValang(String fieldName, Annotation a, MessageSourceAccessor messages) {
        Min annotation = (Min) a;

        String errMsg = messages.getMessage(annotation.errorCode(), annotation.message());
        String applyIfValang = valangToJS(annotation.applyIf());

        StringBuffer sb = new StringBuffer();
        sb.append(" function() {return this.moreThanOrEquals((this.getPropertyValue(");
        sb.append(wrapAndEscapeJsString(fieldName));// field
        sb.append(")), (");
        sb.append(annotation.value());
        sb.append("))}");

        return buildBasicRule(fieldName, errMsg, sb.toString(), applyIfValang, annotation);
    }

}