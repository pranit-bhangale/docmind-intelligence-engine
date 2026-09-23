package com.pranit.docmind;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.modulith.core.ApplicationModules;

@SpringBootTest
class DocmindApplicationTests {

    private static final Logger log = LoggerFactory.getLogger(DocmindApplicationTests.class);

    @Test
    void contextLoads() {
        String cyan = "\u001B[36m";
        String reset = "\u001B[0m";
        String green = "\u001B[32m";
        ApplicationModules modules = ApplicationModules.of(DocmindApplication.class);
        modules.forEach(module ->
                log.info("{} Module: {} {}", cyan, module.getDisplayName(), reset));
        modules.verify();
        log.info("{} ✓ All modules verified successfully! {}", green, reset);
    }
}
