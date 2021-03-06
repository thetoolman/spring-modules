/*
 * Copyright 2002-2007 the original author or authors.
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
 */

package org.springmodules.lucene.index.document.handler;

import junit.framework.TestCase;

public class IdentityDocumentMatchingTests extends TestCase {
	public void testMatch() throws Exception {
		DocumentMatching documentMatching = new IdentityDocumentMatching("test");
		assertTrue(documentMatching.match("test"));
	}

	public void testMatchAll() throws Exception {
		DocumentMatching documentMatching = new IdentityDocumentMatching("*");
		assertTrue(documentMatching.match("test"));
		assertTrue(documentMatching.match("test1"));
		assertTrue(documentMatching.match("1test"));
		assertTrue(documentMatching.match("te1st"));
	}

	public void testNotMatch() throws Exception {
		DocumentMatching documentMatching = new IdentityDocumentMatching("test");
		assertFalse(documentMatching.match("test1"));
	}
}
