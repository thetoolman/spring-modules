package org.springmodules.validation.bean.javascript.taglib;

import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;

import javax.servlet.jsp.JspWriter;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.context.support.MessageSourceAccessor;
import org.springmodules.validation.valang.javascript.AbstractValangJavaScriptTranslator;

public class CommandObjectToValangConverter extends AbstractValangJavaScriptTranslator {

    public CommandObjectToValangConverter() {
        super();
        registerAnnotationHandler(new EmailHandler());
        registerAnnotationHandler(new ExpressionHandler());
        registerAnnotationHandler(new InThePastFutureHandler());
        registerAnnotationHandler(new LengthSizeHandler());
        registerAnnotationHandler(new MaxHandler());
        registerAnnotationHandler(new MaxLengthSizeHandler());
        registerAnnotationHandler(new MinHandler());
        registerAnnotationHandler(new MinLengthSizeHandler());
        registerAnnotationHandler(new NotBlankEmptyHandler());
        registerAnnotationHandler(new NotNullHandler());
        registerAnnotationHandler(new RangeHandler());
        registerAnnotationHandler(new RegExpHandler());
    }

    private final static Log logger = LogFactory.getLog(CommandObjectToValangConverter.class);

    Collection<Handler> supportedAnnotations = new ArrayList<Handler>();

    public void writeJS(String commandName, Object commandObj, JspWriter out, MessageSourceAccessor messages)
            throws IOException {

        // TODO class annotations?

        setWriter(out);

        out.write("new ValangValidator(");
        appendJsString(commandName);
        append(',');
        append(Boolean.toString(true)); // install to the form on creation
        append(", new Array(");
        // start array

        String prefix = "\n"; // No comma prefix for first rule

        for (Field field : commandObj.getClass().getDeclaredFields()) {
            Annotation[] annotations = field.getAnnotations();
            for (Annotation annotation : annotations) {
                logger.debug(annotation + " : " + annotation.getClass());
                Handler handler = getHandler(annotation);
                if (handler != null) {

                    String valangJS = handler.convertToValang(field, annotation, messages);
                    if (valangJS != null) {
                        append(prefix + valangJS);
                        prefix = ",\n"; // start adding commas after first rule
                    }
                    if (logger.isDebugEnabled()) {
                        logger.debug("Annotation " + annotation.getClass() + " on command object "
                                + commandObj.getClass() + " generated: " + valangJS);
                    }

                } else if (logger.isWarnEnabled()) {
                    logger.warn("Unsupported annotation " + annotation.getClass() + " on command object "
                            + commandObj.getClass());
                }

            }
        }
        // end array
        append("\n) )");
        clearWriter();
    }

    private Handler getHandler(Annotation annotation) {
        for (Handler h : supportedAnnotations) {
            if (h.supports(annotation)) {
                return h;
            }
        }
        if (logger.isDebugEnabled()) {
            logger.debug("Annotation not supported: " + annotation);
        }
        return null;
    }

    public void registerAnnotationHandler(Handler handler) {
        if (handler == null) {
            return;
        }
        supportedAnnotations.add(handler);
    }

}
