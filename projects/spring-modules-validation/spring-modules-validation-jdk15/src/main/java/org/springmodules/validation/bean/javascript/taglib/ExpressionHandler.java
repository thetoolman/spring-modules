package org.springmodules.validation.bean.javascript.taglib;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;

import org.springframework.context.support.MessageSourceAccessor;
import org.springmodules.validation.bean.conf.loader.annotation.handler.Expression;

public class ExpressionHandler extends Handler {

    public ExpressionHandler() {
        super(Expression.class);
    }

    @Override
    public String convertToValang(Field field, Annotation a, MessageSourceAccessor messages) {
        Expression annotation = (Expression) a;

        String name = field.getName();
        String errMsg = messages.getMessage(annotation.errorCode(), annotation.message());

        StringBuffer sb = new StringBuffer();
        sb.append(" function() {return this.equals((this.EmailFunction(this.getPropertyValue(");
        sb.append(wrapAndEscapeJsString(name)); // name
        sb.append("))), (true))}");

        // return buildBasicRule(name, errMsg, sb.toString(), annotation);
        return null;
    }

}