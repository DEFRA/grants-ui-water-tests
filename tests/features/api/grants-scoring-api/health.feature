@api @grants-scoring-api @health @dev
Feature: Grants Scoring API - Health Checks

  Background: Ensure the grants scoring API is running
    Given the Grants Scoring API is running

  Scenario: Check the health of the grants scoring API
    When I check the health endpoint
    Then I should receive a healthy response