package org.springmodules.validation.bean.javascript.taglib;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.context.support.MessageSourceAccessor;
import org.springframework.web.util.JavaScriptUtils;
import org.springmodules.validation.bean.context.ValidationContextUtils;
import org.springmodules.validation.bean.rule.AbstractValidationRule;

public abstract class Handler {

    private final static Log logger = LogFactory.getLog(Handler.class);

    public final static String CONTEXTS_ATTR = "contexts";

    protected Class[] supportedAnnotationTypes;

    public abstract String convertToValang(Field field, Annotation annotation, MessageSourceAccessor messages);

    /* Helpers */

    protected String buildBasicRule(String fieldName, String errMsg, String function, Annotation annotation) {
        // TODO applyIf
        if (!isApplicableContext(annotation)) {
            logger.debug("Anotation not suitable for this context.");
            return null;
        }

        StringBuffer sb = new StringBuffer();
        sb.append("new ValangValidator.Rule(");
        sb.append(wrapAndEscapeJsString(fieldName));
        sb.append(",'',");// valangStufNotImplementedField
        sb.append(wrapAndEscapeJsString(errMsg));
        sb.append(',');
        sb.append(function);
        sb.append(")");

        return sb.toString();
    }

    public String wrapAndEscapeJsString(String string) {
        StringBuffer sb = new StringBuffer();
        sb.append('\'');
        if (string == null) {
            sb.append("null");
        } else {
            sb.append(JavaScriptUtils.javaScriptEscape(string));
        }
        sb.append('\'');

        return sb.toString();
    }

    /* Helpers for context support - not yet working ? */
    // TODO test and fix
    protected static boolean isApplicableContext(Annotation a) {
        return ValidationContextUtils.tokensSupportedByCurrentContext(extractApplicableContexts(a));
    }

    /**
     * Extracts the names of the validation context in which the valiation rule is applicable. Expects a "contexts"
     * attribute to hold an array of context names. If it holds an empty array, <code>null </code> is returned. As the
     * contract of {@link AbstractValidationRule#setContextTokens(String[])} defines <code>null</code> means that the
     * rule always applies regardless of the context.
     * 
     * @param annotation
     *            The validation rule annoation.
     * @return The names of the validation contexts in which the
     */
    protected static String[] extractApplicableContexts(Annotation annotation) {
        String[] contexts = (String[]) extractAnnotationAttribute(annotation, CONTEXTS_ATTR);
        return (contexts.length > 0) ? contexts : null;
    }

    protected static Object extractAnnotationAttribute(Annotation annotation, String attributeName) {
        try {
            return annotation.getClass().getMethod(attributeName).invoke(annotation);
        } catch (Exception e) {
            throw new IllegalArgumentException("Expecting attribute '" + attributeName + "' in annotation '"
                    + annotation.getClass().getName() + "'", e);
        }
    }

    /* Helpers for registering handler */

    public Handler(Class... supportedAnnotationTypes) {
        this.supportedAnnotationTypes = supportedAnnotationTypes;
    }

    public boolean supports(Annotation annotation) {
        for (Class supportedType : supportedAnnotationTypes) {
            if (supportedType.isInstance(annotation)) {
                return true;
            }
        }
        return false;
    }
}
